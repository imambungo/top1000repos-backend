import './src/background-jobs.js'

import sql from './src/config/db.js' // https://github.com/porsager/postgres#usage
import server from './src/config/server.js'
import persistent_global_variable from './src/lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

// import iso from 'iso-3166-1' // to get country name from ISO's Alpha-2 country code | https://www.npmjs.com/package/iso-3166-1 | https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes

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

	// let country = ''
	// const fetchCountry = async (ip) => {
	// 	const response = await fetch(`https://api.country.is/${ip}`) // https://country.is/
	// 	if (response.ok) { // https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
	// 		const data = await response.json()
	// 		const isoAlpha2 = data.country // https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes | https://country.is/
	// 		const { country } = iso.whereAlpha2(isoAlpha2) // https://www.npmjs.com/package/iso-3166-1#usage
	// 		return country
	// 	} else {
	// 		let message = `ERROR ${response.status} fetchCountry(${ip})` // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
	// 		message += `\nhttps://api.country.is/${ip}`
	// 		if (response.status == 400) message += `\n${JSON.stringify(data, null, 2)}` // https://stackoverflow.com/q/5612787/9157799#comment53474797_5612849
	// 		return message
	// 	}
	// }
	// country = await fetchCountry(req.ip) // https://stackoverflow.com/a/45415758/9157799

	const userAgent = req.get('user-agent') // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
	if (!userAgent.includes('Googlebot') && !userAgent.includes('bingbot') && !userAgent.includes('AhrefsBot')) {
		const message = `User-Agent: ${userAgent}`
		console.log(message)
		await sendToTelegram(message)
	}
})

server.get('/send-report', async (req, res) => {
	res.send({
		'ok': true
	})

	console.log(req.query.message) // https://stackoverflow.com/a/69230317/9157799 | https://stackoverflow.com/a/18524191/9157799
	await sendToTelegram(req.query.message)
})

const sendToTelegram = async (message) => { // https://core.telegram.org/bots/api#sendmessage
	const requestBody = {
		'chat_id': process.env.TELEGRAM_USER_ID,
		'text': message,
		'parse_mode': 'HTML' // https://core.telegram.org/bots/api#formatting-options | https://stackoverflow.com/a/49538689/9157799
	}
	try { // handle ConnectTimeoutError
		const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_TOKEN}/sendMessage`, {
			 method: 'POST',
			 body: JSON.stringify(requestBody),
			 headers: { 'Content-Type': 'application/json' }
		})
		const data = await response.json()
		if (!response.ok) { // if API/HTTP error | https://stackoverflow.com/a/38236296/9157799
			console.log(`API error:\n${response.status} ${JSON.stringify(data, null, 2)}`) // https://stackoverflow.com/q/5612787/9157799#comment53474797_5612849
		}
	} catch (err) {
		console.log(`Failed to fetch to telegram API:\n${err}`)
	}
}