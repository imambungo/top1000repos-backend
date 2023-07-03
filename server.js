import './src/background-jobs.js'

import sql from './src/config/db.js' // https://github.com/porsager/postgres#usage
import server from './src/config/server.js'
import persistent_global_variable from './src/lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

// server.get('/', (req, res) => {
// 	res.send('Hello World!')
// })

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

	console.log('GET /repositories')
	await sendToTelegram('`GET /repositories`')
})

server.post('/send-report', async (req, res) => {
	res.send({
		'ok': true
	})

	console.log(req.body.message)
	await sendToTelegram(req.body.message)
})

const sendToTelegram = async (message) => { // https://core.telegram.org/bots/api#sendmessage
	const requestBody = {
		'chat_id': process.env.TELEGRAM_USER_ID,
		'text': message,
		'parse_mode': 'MarkdownV2' // https://core.telegram.org/bots/api#formatting-options
	}
	await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_TOKEN}/sendMessage`, {
		 method: 'POST',
		 body: JSON.stringify(requestBody),
		 headers: { 'Content-Type': 'application/json' }
	})
}