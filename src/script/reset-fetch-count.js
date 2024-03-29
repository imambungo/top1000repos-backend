// https://github.com/porsager/postgres#usage
import sql from './../config/db.js'
import persistent_global_variable from './../lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

await pgv.set('repo_daily_fetch_count', 0) // the awaits are important to make sure the code finishes before below exception is thrown
await pgv.set('top_5_closed_pr_daily_fetch_count', 0)
await pgv.set('top_5_closed_issues_daily_fetch_count', 0)
await pgv.set('top_5_open_issues_daily_fetch_count', 0)

throw 'SUCCESS! THIS IS NOT AN ERROR!' // creating database instance cause the script to persist | https://stackoverflow.com/a/7223319/9157799