// https://github.com/porsager/postgres#usage
import sql from './db.js' // db.js is not version controlled

await sql.file('github top repos.sql') // the schema
await sql`
	INSERT INTO fetch_task (name)
	       VALUES ('repo'), ('top 5 pr'), ('top 5 issues');
`

throw 'SUCCESS! THIS IS NOT AN ERROR!' // creating database instance cause the script to persist | https://stackoverflow.com/a/7223319/9157799
