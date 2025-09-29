import { send_to_telegram } from "./send_to_telegram.js" // TEMPORARY

let connection_is_ready = true // should throw an error if not ready for 30s: https://github.com/porsager/postgres?tab=readme-ov-file#connect_timeout
const persistent_global_variable = sql => ({
   get: async name => {
      try { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
			if (connection_is_ready) {
				const [{ value }] = await sql`SELECT value FROM persistent_global_variable WHERE name = ${name}` // https://github.com/porsager/postgres#usage
				return JSON.parse(value)
			} else {
				console.log('not ready') // TEMPORARY
				await send_to_telegram('not ready') // TEMPORARY
			}
      } catch (error) {
         if (error.message.includes("ECONNRESET")) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#instance_properties
				console.log('catch ECONNRESET') // TEMPORARY
				await send_to_telegram('catch ECONNRESET') // TEMPORARY
            await sql.reinstantiate()
				connection_is_ready = false
            const [{ value }] = await sql`SELECT value FROM persistent_global_variable WHERE name = ${name}` // https://github.com/porsager/postgres#usage
				connection_is_ready = true
				console.log('ECONNRESET survived') // TEMPORARY
            await send_to_telegram('ECONNRESET survived') // TEMPORARY
            return JSON.parse(value)
         } else {
				console.log(`not ECONNRESET: pgv.get('${name}')`) // TEMPORARY
				await send_to_telegram(`not ECONNRESET: pgv.get('${name}')`) // TEMPORARY
            console.error(error) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw
         }
      }
   },
   set: async (name, value) => await sql`UPDATE persistent_global_variable SET value = ${JSON.stringify(value)} WHERE name = ${name}`,
   increment: async name => await sql`UPDATE persistent_global_variable SET value = value::int + 1 WHERE name = ${name}` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
})
export default persistent_global_variable // https://stackoverflow.com/q/36261225/9157799