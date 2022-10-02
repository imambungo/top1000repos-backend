// https://github.com/porsager/postgres#usage
import sql from './db.js' // db.js is not version controlled

await sql.file('github top repos.sql') // the schema
await sql`
	INSERT INTO standalone_data
	       VALUES ('server_last_active_date', '2000-01-01'),
			        ('repo_daily_fetch_count', '0'),
					  ('top_5_pr_daily_fetch_count', '0'),
					  ('top_5_issues_daily_fetch_count', '0');
`

throw 'SUCCESS! THIS IS NOT AN ERROR!' // creating database instance cause the script to persist | https://stackoverflow.com/a/7223319/9157799
