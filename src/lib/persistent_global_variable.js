const persistent_global_variable = sql => ({
   get: async name => {
      const [{ value }] = await sql`SELECT value FROM standalone_data WHERE name = ${name}` // https://github.com/porsager/postgres#usage
      return JSON.parse(value)
   },
   set: async (name, value) => await sql`UPDATE standalone_data SET value = ${JSON.stringify(value)} WHERE name = ${name}`,
   increment: async name => await sql`UPDATE standalone_data SET value = value::int + 1 WHERE name = ${name}` // https://stackoverflow.com/q/10233298/9157799#comment17889893_10233360
})
export default persistent_global_variable // https://stackoverflow.com/q/36261225/9157799