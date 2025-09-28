import 'dotenv/config' // https://www.npmjs.com/package/dotenv#%EF%B8%8F-usage

import './src/background-jobs.js'

import sql from './src/config/db.js' // https://github.com/porsager/postgres#usage
import server from './src/config/server.js'
import persistent_global_variable from './src/lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

import { send_to_telegram } from './src/lib/send_to_telegram.js'

server.get('/repositories', async (req, res) => {
	let repos = await sql`
		SELECT
			id, full_name, html_url, description, last_commit_date, stargazers_count, archived, topics, last_verified_at, num_of_closed_pr_since_1_year, open_issues_count, total_thumbs_up_of_top_5_closed_pr_since_1_year, total_thumbs_up_of_top_5_closed_issues_since_1_year, total_thumbs_up_of_top_5_open_issue_of_all_time, has_issues
		FROM repository;
	`
	repos = repos.map(repo => ({ // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
		...repo, // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals
		last_commit_date: repo.last_commit_date.toISOString().slice(0, 10), // "2022-10-18T00:00:00.000Z" -> "2022-10-18" | https://stackoverflow.com/a/35922073/9157799
		last_verified_at: repo.last_verified_at.toISOString().slice(0, 10), // "2022-10-18T00:00:00.000Z" -> "2022-10-18" | https://stackoverflow.com/a/35922073/9157799
	}))
	res.send(repos) // res.send() is equal to res.json()

	await pgv.increment('visitor_count')

	// const userAgent = req.get('user-agent') // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
	// if (!userAgent.includes('Googlebot') && !userAgent.includes('bingbot') && !userAgent.includes('AhrefsBot')) {
	// 	const message = `User-Agent: ${userAgent}`
	// 	console.log(message)
	// 	await send_to_telegram(message)
	// }
})

server.get('/send-report', async (req, res) => {
	res.send({
		'ok': true
	})

	console.log(req.query.message) // https://stackoverflow.com/a/69230317/9157799 | https://stackoverflow.com/a/18524191/9157799
	await send_to_telegram(req.query.message)
})