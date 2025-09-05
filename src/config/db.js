import * as dotenv from 'dotenv' // see https://www.npmjs.com/package/dotenv#usage
dotenv.config()

import postgres from 'postgres' // https://github.com/porsager/postgres
const sql = postgres() // https://github.com/porsager/postgres#postgresurl-options | Options will fall back to psql environment variables: https://github.com/porsager/postgres#environmental-variables | https://www.postgresql.org/docs/current/libpq-envars.html

await sql`SELECT 1;` // if the password is wrong, throw error as early as possible. Postgres.js doesn't check the validity of the options right away. | https://stackoverflow.com/a/3670000/9157799

export default sql
