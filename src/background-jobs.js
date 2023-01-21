import cron from 'node-cron' // https://www.npmjs.com/package/node-cron
import { today, a_year_ago } from './lib/date.js'

let G_fetch_quota = 10 // fetch quota per minute
let task1 = cron.schedule('* * * * *', () => { // every minute, reset fetch quota
	G_fetch_quota = 10
});

import sql from './config/db.js' // https://github.com/porsager/postgres#usage
import persistent_global_variable from './lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

let task23 = cron.schedule('*/6 * * * * *', async () => { // every 6 second | https://stackoverflow.com/a/59800039/9157799
	if (G_fetch_quota > 0) {
		if (await pgv.get('server_last_active_date') != today()) { // different SQL statement should be splitted | https://github.com/porsager/postgres/issues/86#issuecomment-668217732
			pgv.set('repo_daily_fetch_count', 0)
			pgv.set('top_5_pr_daily_fetch_count', 0)
			pgv.set('top_5_issues_daily_fetch_count', 0)
			pgv.set('server_last_active_date', today())
		} else if (await pgv.get('repo_daily_fetch_count') < 10) { // fetch repos and stuff
			const fetch_repos = async (page) => {
				const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`);
				const data = await response.json();
				return data
			}

			const upsert_repo = async (sql, repo) => {
				const { id, full_name, html_url, description, stargazers_count, open_issues_count, archived, topics } = repo
				const license_key = repo.license ? repo.license.key : null
				const last_commit_date = repo.pushed_at.slice(0, 10) // slice 2022-09-14 from 2022-09-14T23:19:32Z
				const owner_avatar_url = repo.owner.avatar_url
				const last_verified_at = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
			
				repo = {
					id, full_name, html_url, description, stargazers_count, open_issues_count, archived, topics,
					license_key,
					last_commit_date,
					owner_avatar_url,
					last_verified_at
				}
				await sql`
					INSERT INTO repository
						${sql(repo)}            -- https://github.com/porsager/postgres#dynamic-inserts
					ON CONFLICT (id) DO UPDATE
						SET ${sql(repo)}        -- https://github.com/porsager/postgres#dynamic-columns-in-updates
				` // https://stackoverflow.com/a/1109198/9157799
			}

			const clear_outdated_repos = async (sql, date) => {
				const deletedRepos = await sql`DELETE FROM repository WHERE last_verified_at < ${date} RETURNING *;`
				console.log(`cleared ${deletedRepos.length} outdated repos`)
			}

			const page_to_fetch = await pgv.get('repo_daily_fetch_count') + 1
			const { items: repos } = await fetch_repos(page_to_fetch) // https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=1&per_page=100
			G_fetch_quota--
			repos.forEach(repo => upsert_repo(sql, repo)) // max item per page is 100 | https://docs.github.com/en/rest/overview/resources-in-the-rest-api#pagination
			await pgv.increment('repo_daily_fetch_count')
			console.log(`fetched repos (page ${page_to_fetch})`);
			if (page_to_fetch == 10) clear_outdated_repos(sql, today())
		} else if (await pgv.get('top_5_pr_daily_fetch_count') < 1000) { // fetch top 5 pr and stuff
			const fetch_top_5_closed_PR_since = async (repo_full_name, date) => { // fetch top 5 closed PR of the last 365 days
				const response = await fetch(`https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:pr%20closed:%3E${date}%20repo:${repo_full_name}`)
				const data = await response.json()
				return data
			}

			const insert_PR = async (sql, pr, repository_id) => {
				const { number, html_url, title } = pr
				const thumbs_up = pr.reactions['+1'] // https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:pr%20closed:%3E2022-01-25%20repo:flutter/flutter
				const closed_date = pr.closed_at.slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
				await sql`INSERT INTO closed_pr VALUES (${repository_id}, ${number}, ${html_url}, ${title}, ${thumbs_up}, ${closed_date})`
			}
			
			const repo_number = await pgv.get('top_5_pr_daily_fetch_count') + 1
			const repo_full_name = await get_repo_full_name(sql, repo_number)
			const { items: pull_requests } = await fetch_top_5_closed_PR_since(repo_full_name, a_year_ago())
			G_fetch_quota--
			const repository_id = await get_repo_id(sql, repo_full_name)
			await sql`DELETE FROM closed_pr WHERE repository_id = ${repository_id}` // delete previous top 5 PRs of <repo_full_name>
			pull_requests.forEach(pr => insert_PR(sql, pr, repository_id))
			await pgv.increment('top_5_pr_daily_fetch_count')
			console.log(`fetched top 5 closed PR (repo ${repo_number})`)

			await sql`UPDATE repository SET num_of_closed_pr_since_1_year = ${data.total_count} WHERE id = ${repository_id};`
		} else if (await pgv.get('top_5_issues_daily_fetch_count') < 1000) { // fetch top 5 issues and stuff
			const fetch_top_5_open_issues = async (repo_full_name) => { // fetch top 5 open issues of all time
				const response = await fetch(`https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=type:issue%20state:open%20repo:${repo_full_name}`)
				const data = await response.json()
				return data
			}

			const insert_issue = async (sql, issue, repository_id) => {
				const { number, html_url, title } = issue
				const thumbs_up = issue.reactions['+1'] // https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=type:issue%20state:open%20repo:flutter/flutter
				await sql`INSERT INTO open_issue VALUES (${repository_id}, ${number}, ${html_url}, ${title}, ${thumbs_up})`
			}

			const repo_number = pgv.get('top_5_issues_daily_fetch_count') + 1
			const repo_full_name = await get_repo_full_name(sql, repo_number)
			const { items: issues } = await fetch_top_5_open_issues(repo_full_name)
			G_fetch_quota--
			const repository_id = await get_repo_id(sql, repo_full_name)
			await sql`DELETE FROM open_issue WHERE repository_id = ${repository_id}` // delete previous top 5 open issues of <repo_full_name>
			issues.forEach(issue => insert_issue(sql, issue, repository_id))
			pgv.increment('top_5_issues_daily_fetch_count')
			console.log(`fetched top 5 open issues (repo ${repo_number})`)

			await sql`UPDATE repository SET num_of_closed_issue_since_1_year = ${data.total_count} WHERE id = ${repository_id};`
		}
	}
}, { timezone: 'Etc/UTC' }); //https://stackoverflow.com/a/74234498/9157799

const get_repo_full_name = async (sql, repo_number) => {
	const [{ full_name }] = await sql` -- https://github.com/porsager/postgres#usage
		SELECT full_name
			FROM (
				SELECT row_number() OVER (ORDER BY stargazers_count DESC), full_name FROM repository
			) as stupid_alias  -- https://stackoverflow.com/q/14767209/9157799#comment56350360_14767216
			WHERE row_number = ${repo_number};
	`
	return full_name
}

const get_repo_id = async (sql, repo_full_name) => {
	const [{ id: repo_id }] = await sql`SELECT id FROM repository WHERE full_name = ${repo_full_name}` // https://github.com/porsager/postgres#usage
	return repo_id
}