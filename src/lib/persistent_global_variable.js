// TEMPORARY
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

const persistent_global_variable = sql => ({
   get: async name => {
      try { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
         const [{ value }] = await sql`SELECT value FROM persistent_global_variable WHERE name = ${name}` // https://github.com/porsager/postgres#usage
         return JSON.parse(value)
      } catch (error) {
         if (error.message.includes("ECONNRESET")) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#instance_properties
				console.log('catch ECONNRESET') // TEMPORARY
				await sendToTelegram('catch ECONNRESET') // TEMPORARY
            await sql.end()

				// CONNECTION_ENDED https://github.com/porsager/postgres?tab=readme-ov-file#connection_ended

            const [{ value }] = await sql`SELECT value FROM persistent_global_variable WHERE name = ${name}` // https://github.com/porsager/postgres#usage
				console.log('ECONNRESET survived') // TEMPORARY
            await sendToTelegram('ECONNRESET survived') // TEMPORARY
            return JSON.parse(value)
         } else {
				console.log('not ECONNRESET') // TEMPORARY
				await sendToTelegram('not ECONNRESET') // TEMPORARY
            console.error(error) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw
         }
      }
   },
   set: async (name, value) => await sql`UPDATE persistent_global_variable SET value = ${JSON.stringify(value)} WHERE name = ${name}`,
   increment: async name => await sql`UPDATE persistent_global_variable SET value = value::int + 1 WHERE name = ${name}` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
})
export default persistent_global_variable // https://stackoverflow.com/q/36261225/9157799