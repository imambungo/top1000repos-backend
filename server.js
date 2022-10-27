import cron from 'node-cron' // https://www.npmjs.com/package/node-cron

let G_fetch_quota = 10 // fetch quota per minute
let task1 = cron.schedule('* * * * *', () => { // every minute, reset fetch quota
	G_fetch_quota = 10
});

import sql from './db.js' // https://github.com/porsager/postgres#usage

let task23 = cron.schedule('*/5 * * * * *', async () => { // every 5 seconds | https://stackoverflow.com/a/59800039/9157799
	if (G_fetch_quota > 0) {
		const standalone_data = await sql`SELECT * FROM standalone_data;`
		const server_last_active_date      = standalone_data.find(o => o.name == 'server_last_active_date').value
		let repo_daily_fetch_count         = standalone_data.find(o => o.name == 'repo_daily_fetch_count').value // https://stackoverflow.com/a/35397839/9157799
		let top_5_pr_daily_fetch_count     = standalone_data.find(o => o.name == 'top_5_pr_daily_fetch_count').value
		let top_5_issues_daily_fetch_count = standalone_data.find(o => o.name == 'top_5_issues_daily_fetch_count').value
		repo_daily_fetch_count         = parseInt(repo_daily_fetch_count)
		top_5_pr_daily_fetch_count     = parseInt(top_5_pr_daily_fetch_count)
		top_5_issues_daily_fetch_count = parseInt(top_5_issues_daily_fetch_count)
		if (server_last_active_date != today()) { // reset all daily_fetch_count to 0 and set server_last_active_date to today
			await sql`UPDATE standalone_data SET value = 0 WHERE name != 'server_last_active_date';`
			await sql`UPDATE standalone_data SET value = ${today()} WHERE name = 'server_last_active_date';` // different SQL statement should be splitted | https://github.com/porsager/postgres/issues/86#issuecomment-668217732
		} else if (repo_daily_fetch_count < 10) { // fetch repos and stuff
			const page_to_fetch = repo_daily_fetch_count + 1
			const data = await fetchRepos(page_to_fetch)
			G_fetch_quota--
			for (let i = 0; i < 100; i++) { // max item per page | https://docs.github.com/en/rest/overview/resources-in-the-rest-api#pagination
				const repo = data.items[i] // https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=1&per_page=100
				upsertRepo(repo)
			}
			await sql`UPDATE standalone_data SET value = value::int + 1 WHERE name = 'repo_daily_fetch_count';` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
			console.log(`fetched repos (page ${page_to_fetch})`);
			if (page_to_fetch == 10) clearOutdatedRepo()
		} else if (top_5_pr_daily_fetch_count < 1000) { // fetch top 5 pr and stuff
			const repo_number = top_5_pr_daily_fetch_count + 1
			const repo_full_name = await getRepoFullName(repo_number)
			const data = await fetchTop5PR(repo_full_name)
			G_fetch_quota--
			const [{ id: repository_id }] = await sql`SELECT id FROM repository WHERE full_name = ${repo_full_name}` // https://github.com/porsager/postgres#usage
			await sql`DELETE FROM closed_pr WHERE repository_id = ${repository_id}` // delete previous top 5 PRs of <repo_full_name>
			let num_of_pr = 5
			if (data.items.length < 5) num_of_pr = data.items.length // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length
			for (let i = 0; i < num_of_pr; i++) {
				const pr = data.items[i] // https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:pr%20closed:%3E2022-01-25%20repo:flutter/flutter
				insertPR(pr, repository_id)
			}
			await sql`UPDATE standalone_data SET value = value::int + 1 WHERE name = 'top_5_pr_daily_fetch_count';` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
			console.log(`fetched top 5 pr (repo ${repo_number})`)
		} else if (top_5_issues_daily_fetch_count < 1000) { // fetch top 5 issues and stuff
			const repo_number = top_5_issues_daily_fetch_count + 1
			const repo_full_name = await getRepoFullName(repo_number)
			const data = await fetchTop5Issue(repo_full_name)
			G_fetch_quota--
			const [{ id: repository_id }] = await sql`SELECT id FROM repository WHERE full_name = ${repo_full_name}` // https://github.com/porsager/postgres#usage
			await sql`DELETE FROM open_issue WHERE repository_id = ${repository_id}` // delete previous top 5 open issues of <repo_full_name>
			let num_of_issues = 5
			if (data.items.length < 5) num_of_issues = data.items.length // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length
			for (let i = 0; i < num_of_issues; i++) {
				const issue = data.items[i] // https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=type:issue%20state:open%20repo:flutter/flutter
				insertIssue(issue, repository_id)
			}
			await sql`UPDATE standalone_data SET value = value::int + 1 WHERE name = 'top_5_issues_daily_fetch_count';` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
			console.log(`fetched top 5 issue (repo ${repo_number})`)
		}
	}
});


// https://expressjs.com/en/starter/hello-world.html
import express from 'express' // dk usah pake require: https://stackoverflow.com/a/64655153/9157799
const server = express()

const port = 3000
server.listen(port, () => {
	console.log(`server listening on port ${port} (localhost:${port})`)
})


import cors from 'cors' // https://www.npmjs.com/package/cors#usage
const corsOptions = {
	origin: 'http://localhost:5173',
	optionsSuccessStatus: 200
}
server.use(cors(corsOptions))


server.get('/', (req, res) => {
	res.send('Hello World!')
})

server.get('/repositories', async (req, res) => {
	console.log('GET: /repositories')
	let repos = await sql`
		SELECT
		  id, full_name, html_url, description, last_commit_date, stargazers_count, topics,
		  sum as top_5_pr_thumbs_up
		FROM repository INNER JOIN (
		  SELECT
			 repository_id, SUM(thumbs_up)
		  FROM closed_pr GROUP BY repository_id
		) as total_thumbs_up ON repository.id = total_thumbs_up.repository_id;
	` // TODO: consider a dedicated top_5_pr_thumbs_up column in repository
	repos = repos.map(repo => ({ // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
		...repo, // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals
		last_commit_date: repo.last_commit_date.toISOString().slice(0, 10), // "2022-10-18T00:00:00.000Z" -> "2022-10-18" | https://stackoverflow.com/a/35922073/9157799
	}))
	res.send(repos)
})



const today = () => {
	return new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
}

const clearOutdatedRepo = async () => {
	const deletedRepos = await sql`DELETE FROM repository WHERE last_verified_at < ${today()} RETURNING *;`
	console.log(`cleared ${deletedRepos.length} outdated repos`)
}

const insertIssue = async (issue, repository_id) => {
	const { number, html_url, title } = issue
	const thumbs_up = issue.reactions['+1'] // https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=type:issue%20state:open%20repo:flutter/flutter
	await sql`INSERT INTO open_issue VALUES (${repository_id}, ${number}, ${html_url}, ${title}, ${thumbs_up})`
}

const fetchTop5Issue = async (repo_full_name) => { // fetch top 5 open issues of all time
	const response = await fetch(`https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=type:issue%20state:open%20repo:${repo_full_name}`)
	const data = await response.json()
	return data
}

const fetchRepos = async (page) => {
	const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`);
	const data = await response.json();
	return data
}

const upsertRepo = async (repo) => {
	const { id, full_name, html_url, description, stargazers_count, open_issues_count, topics } = repo
	const issue_per_star_ratio = open_issues_count / stargazers_count
	const license_key = repo.license ? repo.license.key : null
	const last_commit_date = repo.pushed_at.slice(0, 10) // slice 2022-09-14 from 2022-09-14T23:19:32Z
	const owner_avatar_url = repo.owner.avatar_url
	const last_verified_at = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799

	await sql`
		INSERT INTO repository
			VALUES (${id}, ${full_name}, ${owner_avatar_url}, ${html_url}, ${description}, ${last_commit_date}, ${stargazers_count}, ${license_key}, ${last_verified_at}, ${issue_per_star_ratio}, ${open_issues_count}, ${topics})
		ON CONFLICT (id) DO UPDATE
			SET full_name = ${full_name},
				owner_avatar_url = ${owner_avatar_url},
				html_url = ${html_url},
				description = ${description},
				last_commit_date = ${last_commit_date},
				stargazers_count = ${stargazers_count},
				license_key = ${license_key},
				last_verified_at = ${last_verified_at},
				issue_per_star_ratio = ${issue_per_star_ratio},
				open_issues_count = ${open_issues_count},
				topics = ${topics};
	` // https://stackoverflow.com/a/1109198/9157799
}

const getRepoFullName = async (repo_number) => {
	const [{ full_name }] = await sql` -- https://github.com/porsager/postgres#usage
		SELECT full_name
			FROM (
				SELECT row_number() OVER (ORDER BY stargazers_count DESC), full_name FROM repository
			) as stupid_alias  -- https://stackoverflow.com/q/14767209/9157799#comment56350360_14767216
			WHERE row_number = ${repo_number};
	`
	return full_name
}

const fetchTop5PR = async (repo_full_name) => { // fetch top 5 closed PR of the last 365 days
	const aYearAgo = () => {
		const date = new Date()
		date.setDate(date.getDate() - 365) // https://stackoverflow.com/a/13838662/9157799
		return date.toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
	}
	const response = await fetch(`https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:pr%20closed:%3E${aYearAgo()}%20repo:${repo_full_name}`)
	const data = await response.json()
	return data
}

const insertPR = async (pr, repository_id) => {
	const { number, html_url, title } = pr
	const thumbs_up = pr.reactions['+1'] // https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:pr%20closed:%3E2022-01-25%20repo:flutter/flutter
	const closed_date = pr.closed_at.slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
	await sql`INSERT INTO closed_pr VALUES (${repository_id}, ${number}, ${html_url}, ${title}, ${thumbs_up}, ${closed_date})`
}
