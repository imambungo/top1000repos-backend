// https://github.com/porsager/postgres#usage
import sql from './db.js' // db.js is not version controlled

await sql.file('github top repos.sql')