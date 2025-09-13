export const send_to_telegram = async (message) => { // https://core.telegram.org/bots/api#sendmessage
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