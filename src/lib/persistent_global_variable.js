const persistent_global_variable = sql => ({
   get: async name => {
      const [{ value }] = await sql`SELECT value FROM persistent_global_variable WHERE name = ${name}` // https://github.com/porsager/postgres#usage
      console.log(`value ${value}`)
      try {
         console.log(`json parse ${JSON.parse(value)}`)
      } catch (e) {
         console.log(e)
      }
      return JSON.parse(value)
   },
   set: async (name, value) => await sql`UPDATE persistent_global_variable SET value = ${JSON.stringify(value)} WHERE name = ${name}`,
   increment: async name => await sql`UPDATE persistent_global_variable SET value = value::int + 1 WHERE name = ${name}` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
})
export default persistent_global_variable // https://stackoverflow.com/q/36261225/9157799