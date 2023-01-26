// https://github.com/porsager/postgres#usage
import sql from './../config/db.js'

await sql.file('./src/github top repos.sql') // the schema | use path relative to project root | https://stackoverflow.com/q/70265259/9157799
await sql`
	INSERT INTO persistent_global_variable
	       VALUES ('server_last_active_date', '2000-01-01'),
			        ('repo_daily_fetch_count', '0'),
					  ('top_5_closed_pr_daily_fetch_count', '0'),
					  ('top_5_open_issues_daily_fetch_count', '0');
`

throw 'SUCCESS! THIS IS NOT AN ERROR!' // creating database instance cause the script to persist | https://stackoverflow.com/a/7223319/9157799