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

let task23 = cron.schedule('*/4 * * * * *', async () => { // every 4 seconds | https://stackoverflow.com/a/59800039/9157799
	if (fetch_quota > 0) {
		const fetch_tasks = await sql`
			SELECT * FROM fetch_task;
		`
		const today = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
		const repo_fetch_task         = fetch_tasks.find(x => x.name == 'repo') // https://stackoverflow.com/a/35397839/9157799
		const top_5_pr_fetch_task     = fetch_tasks.find(x => x.name == 'top 5 pr')
		const top_5_issues_fetch_task = fetch_tasks.find(x => x.name == 'top 5 issues')
		if (repo_fetch_task.start_date != today) {
			await sql`
				UPDATE fetch_task SET start_date = ${today}, daily_count = 0
					               WHERE name = 'repo';
			`
		} else if (repo_fetch_task.start_date == today && repo_fetch_task.daily_count < 10) {
			const page_to_fetch = repo_fetch_task.daily_count + 1
			const data = await fetchRepos(page_to_fetch)
			for (let i = 0; i < 100; i++) { // https://docs.github.com/en/rest/overview/resources-in-the-rest-api#pagination
				const repo = data.items[i] // https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=1&per_page=100
				updateOrInsertRepo(repo)
			}
			fetch_quota--
			console.log(`fetched repos (page ${page})`);
			// TODO: if (page_to_fetch == 10) clearOutdatedRepo()
		}
	}
});

// fetch repos. 1 fetch per minute, 1 page (100 repos) per fetch.
let task2 = cron.schedule('* * * * *', async () => { // 0 12 15 * *
	const minute = new Date().getMinutes(); // google "js get minute"
	const page = minute % 10 + 1
});


const fetchRepos = async (page) => {
	const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`);
	const data = await response.json();
	return data
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
