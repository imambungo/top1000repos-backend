// https://github.com/porsager/postgres#usage
import sql from './../config/db.js'
import persistent_global_variable from './../lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

pgv.set('repo_daily_fetch_count', 0)
pgv.set('top_5_pr_daily_fetch_count', 0)
pgv.set('top_5_issues_daily_fetch_count', 0)

throw 'SUCCESS! THIS IS NOT AN ERROR!' // creating database instance cause the script to persist | https://stackoverflow.com/a/7223319/9157799