// https://expressjs.com/en/starter/hello-world.html
import express from 'express' // dk usah pake require: https://github.com/porsager/postgres#usage | https://stackoverflow.com/a/64655153/9157799
const server = express()
const port = 3000

server.get('/', (req, res) => {
	res.send('Hello World!')
})

server.listen(port, () => {
	console.log(`server listening on port ${port} (localhost:${port})`)
})


// https://www.npmjs.com/package/node-cron
import cron from 'node-cron';

let fetch_quota = 10 // fetch quota per minute
let task1 = cron.schedule('* * * * *', () => {
	fetch_quota = 10
});

let task23 = cron.schedule('*/5 * * * * *', async () => { // every 5 seconds | https://stackoverflow.com/a/59800039/9157799
	if (fetch_quota > 0) {
		const standalone_data = await sql`
			SELECT * FROM standalone_data;
		`
		const server_last_active_date      = standalone_data.find(o => o.name == 'server_last_active_date').value
		let repo_daily_fetch_count         = standalone_data.find(o => o.name == 'repo_daily_fetch_count').value // https://stackoverflow.com/a/35397839/9157799
		let top_5_pr_daily_fetch_count     = standalone_data.find(o => o.name == 'top_5_pr_daily_fetch_count').value
		let top_5_issues_daily_fetch_count = standalone_data.find(o => o.name == 'top_5_issues_daily_fetch_count').value
		repo_daily_fetch_count         = parseInt(repo_daily_fetch_count)
		top_5_pr_daily_fetch_count     = parseInt(top_5_pr_daily_fetch_count)
		top_5_issues_daily_fetch_count = parseInt(top_5_issues_daily_fetch_count)
		const today = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
		if (server_last_active_date != today) {
			await sql`
				UPDATE standalone_data SET value = '0' WHERE name != 'server_last_active_date';
			`
			await sql`
				UPDATE standalone_data SET value = ${today} WHERE name = 'server_last_active_date';
			` // different SQL statement should be splitted | https://github.com/porsager/postgres/issues/86#issuecomment-668217732
		} else if (repo_daily_fetch_count < 10) {
			const page_to_fetch = repo_daily_fetch_count + 1
			const data = await fetchRepos(page_to_fetch)
			for (let i = 0; i < 100; i++) { // https://docs.github.com/en/rest/overview/resources-in-the-rest-api#pagination
				const repo = data.items[i] // https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=1&per_page=100
				updateOrInsertRepo(repo)
			}
			await sql`
				UPDATE standalone_data SET value = value::int + 1 WHERE name = 'repo_daily_fetch_count';
			` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
			fetch_quota--
			console.log(`fetched repos (page ${page_to_fetch})`);
			// TODO: if (page_to_fetch == 10) clearOutdatedRepo()
		} else if (top_5_pr_daily_fetch_count < 1000) {
			console.log('c')
			const repo_number = top_5_pr_daily_fetch_count + 1
			const data = await fetchPR(repo_number)
			console.log('cc')
		}
	} else {
		console.log('nope')
	}
});

const fetchRepos = async (page) => {
	const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`);
	const data = await response.json();
	return data
}

const fetchPR = async (repo_number) => {
	console.log('oi')
	const repo_full_name = getRepoFullName(repo_number)
}

const getRepoFullName = async (repo_number) => {
	const [{ full_name }] = await sql`
		SELECT full_name
			FROM (
				SELECT row_number() OVER (ORDER BY stargazers_count DESC), full_name FROM repository
			) as stupid_alias
			WHERE row_number = ${repo_number};
	` // https://github.com/porsager/postgres#usage
	return full_name
}

const updateOrInsertRepo = async (repo) => {
	const id = repo.id
	const full_name = repo.full_name
	const owner_avatar_url = repo.owner.avatar_url
	const html_url = repo.html_url
	const description = repo.description
	const last_commit_date = repo.pushed_at.slice(0, 10) // slice 2022-09-14 from 2022-09-14T23:19:32Z
	const stargazers_count = repo.stargazers_count
	const license_key = repo.license ? repo.license.key : null
	const last_verified_at = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
	const issue_per_star_ratio = repo.open_issues_count / repo.stargazers_count
	const open_issues_count = repo.open_issues_count

	await sql`
		INSERT INTO repository
			VALUES (${id}, ${full_name}, ${owner_avatar_url}, ${html_url}, ${description}, ${last_commit_date}, ${stargazers_count}, ${license_key}, ${last_verified_at}, ${issue_per_star_ratio}, ${open_issues_count})
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
				open_issues_count = ${open_issues_count};
	` // https://stackoverflow.com/a/1109198/9157799
}

// https://github.com/porsager/postgres#usage
import sql from './db.js' // db.js is not version controlled
