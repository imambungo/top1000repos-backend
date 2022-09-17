import prompt_sync from 'prompt-sync' // https://github.com/heapwolf/prompt-sync
const prompt = prompt_sync() // https://stackoverflow.com/q/48593254/9157799
let password = prompt.hide('db password? ') // https://github.com/heapwolf/prompt-sync#prompthideask

import postgres from 'postgres' // https://github.com/porsager/postgres
const sql = postgres({ // https://github.com/porsager/postgres#postgresurl-options
	username: 'postgres',
	database: 'github_top_repos',
	password // equal to 'password: password'
}) // will fall back to psql environment variables: https://github.com/porsager/postgres#environmental-variables | https://www.postgresql.org/docs/current/libpq-envars.html

password = '' // leave no trace ;)

await sql`SELECT 1;` // if the password is wrong, throw error as early as possible. Postgres.js doesn't check the validity of the options right away. | https://stackoverflow.com/a/3670000/9157799

export default sql