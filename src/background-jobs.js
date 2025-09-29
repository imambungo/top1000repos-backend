import Cron from 'croner' // https://www.npmjs.com/package/croner
import { today, a_year_ago } from './lib/date.js'

import sql from './config/db.js' // https://github.com/porsager/postgres#usage
import persistent_global_variable from './lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

import { send_to_telegram } from './lib/send_to_telegram.js'

import { github_api_fetch_options, github_api_version } from './github_api_config.js'
import {
   fetch_repos,
   fetch_top_5_closed_issues_since,
   fetch_top_5_closed_PR_since,
   fetch_repo_new_name,
   get_code_size,
   get_project_size
} from './github_api.js'

import { clear_outdated_repos } from './clear_outdated_repos.js'
import { get_repo_full_name } from './get_repo_full_name.js'
import { get_repo_id } from './get_repo_id.js'
import { upsert_repo } from './upsert_repo.js'

let task_fetch_github_api = Cron('*/6 * * * * *', { timezone: 'Etc/UTC' }, async () => {  // every 6 seconds | https://stackoverflow.com/a/59800039/9157799 | https://crontab.guru/
   // const response = await fetch('https://api.github.com/rate_limit', github_api_fetch_options) // https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28#get-rate-limit-status-for-the-authenticated-user
   // const data = await response.json()
   // console.log(data)
   // const { limit, remaining } = data.resources.core
   // console.log(`GitHub API rate limit: ${remaining}/${limit} requests remaining`)
   if (await pgv.get('server_last_active_date') != today()) { // in UTC: https://stackoverflow.com/a/74234498/9157799 | different SQL statement should be splitted: https://github.com/porsager/postgres/issues/86#issuecomment-668217732
      pgv.set('repo_daily_fetch_count', 0)
      pgv.set('top_5_closed_pr_daily_fetch_count', 0)
      pgv.set('top_5_closed_issues_daily_fetch_count', 0)
      pgv.set('top_5_open_issues_daily_fetch_count', 0)
      pgv.set('code_size_daily_fetch_count', 0)
      pgv.set('project_size_daily_fetch_count', 0)
      pgv.set('server_last_active_date', today())
   } else if (await pgv.get('repo_daily_fetch_count') < 10) { // fetch repos and stuff
      const page_to_fetch = await pgv.get('repo_daily_fetch_count') + 1
      const { items: repos } = await fetch_repos(page_to_fetch) // https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=1&per_page=100
      await Promise.all(repos.map(                 // https://stackoverflow.com/a/37576787/9157799
         async repo => { upsert_repo(sql, repo) }  // max item per page is 100 | https://docs.github.com/en/rest/overview/resources-in-the-rest-api#pagination
      ))                                           // using forEach has a chance to cause race condition with clear_outdated_repos()
      await pgv.increment('repo_daily_fetch_count')
      console.log(`fetched repos (page ${page_to_fetch})`);
      if (page_to_fetch == 10) {
         await clear_outdated_repos(sql, today())
         const [{ count: num_of_repos }] = await sql`SELECT COUNT(id) FROM repository` // handle edge case when a repo at the start or end of page gained or lost rank by 1
         if (num_of_repos < 1000) pgv.set('repo_daily_fetch_count', 0)                 // handle edge case when a repo at the start or end of page gained or lost rank by 1
      }
   } else if (await pgv.get('top_5_closed_pr_daily_fetch_count') < 1000) { // fetch top 5 CLOSED PR and stuff
      const repo_number = await pgv.get('top_5_closed_pr_daily_fetch_count') + 1
      const repo_full_name = await get_repo_full_name(sql, repo_number)
      let num_of_closed_pr_since_1_year, top_5_closed_pr // https://stackoverflow.com/q/59416204/9157799
      try {
         ;( { total_count: num_of_closed_pr_since_1_year, items: top_5_closed_pr } = await fetch_top_5_closed_PR_since(repo_full_name, a_year_ago()) ) // https://stackoverflow.com/q/59416204/9157799
      } catch (e) {
         console.log(e)
         const repo_new_name = await fetch_repo_new_name(repo_full_name) // When the name of the repo or owner is changed, the search API can't detect the new name.
         await sql`UPDATE repository SET full_name = ${repo_new_name} WHERE full_name = ${repo_full_name}`
         return
      }
      const repository_id = await get_repo_id(sql, repo_full_name)
      let total_thumbs_up_of_top_5_closed_pr_since_1_year = 0
      top_5_closed_pr.forEach(pr => total_thumbs_up_of_top_5_closed_pr_since_1_year += pr.reactions['+1'])
      await pgv.increment('top_5_closed_pr_daily_fetch_count')
      if (repo_number % 200 == 0) console.log(`fetched top 5 closed PR (repo ${repo_number})`)
      await sql`UPDATE repository SET num_of_closed_pr_since_1_year = ${num_of_closed_pr_since_1_year}, total_thumbs_up_of_top_5_closed_pr_since_1_year = ${total_thumbs_up_of_top_5_closed_pr_since_1_year} WHERE id = ${repository_id};`
   } else if (await pgv.get('top_5_closed_issues_daily_fetch_count') < 1000) { // fetch top 5 CLOSED ISSUES and stuff
      const repo_number = await pgv.get('top_5_closed_issues_daily_fetch_count') + 1
      const repo_full_name = await get_repo_full_name(sql, repo_number)
      let num_of_closed_issues_since_1_year, top_5_closed_issues // https://stackoverflow.com/q/59416204/9157799
      try {
         ;( { total_count: num_of_closed_issues_since_1_year, items: top_5_closed_issues } = await fetch_top_5_closed_issues_since(repo_full_name, a_year_ago()) ) // https://stackoverflow.com/q/59416204/9157799
      } catch (e) {
         console.log(e)
         const repo_new_name = await fetch_repo_new_name(repo_full_name) // When the name of the repo or owner is changed, the search API can't detect the new name.
         await sql`UPDATE repository SET full_name = ${repo_new_name} WHERE full_name = ${repo_full_name}`
         return
      }
      const repository_id = await get_repo_id(sql, repo_full_name)
      let total_thumbs_up_of_top_5_closed_issues_since_1_year = 0
      top_5_closed_issues.forEach(issue => total_thumbs_up_of_top_5_closed_issues_since_1_year += issue.reactions['+1'])
      await pgv.increment('top_5_closed_issues_daily_fetch_count')
      if (repo_number % 100 == 0) console.log(`fetched top 5 closed issues (repo ${repo_number})`)
      await sql`UPDATE repository SET num_of_closed_issues_since_1_year = ${num_of_closed_issues_since_1_year}, total_thumbs_up_of_top_5_closed_issues_since_1_year = ${total_thumbs_up_of_top_5_closed_issues_since_1_year} WHERE id = ${repository_id};`
   } else if (await pgv.get('code_size_daily_fetch_count') < 1000) { // fetch code size and stuff
      const repo_number = await pgv.get('code_size_daily_fetch_count') + 1
      const repo_full_name = await get_repo_full_name(sql, repo_number)
      const repo_code_size = await get_code_size(repo_full_name) // in bytes
      await pgv.increment('code_size_daily_fetch_count')
      if (repo_number % 100 == 0) console.log(`fetched code size (repo ${repo_number})`)
      const repository_id = await get_repo_id(sql, repo_full_name)
      await sql`UPDATE repository SET code_size = ${repo_code_size} WHERE id = ${repository_id};`
   }
   // } else if (await pgv.get('project_size_daily_fetch_count') < 1000) { // fetch project size and stuff
   //    const repo_number = await pgv.get('project_size_daily_fetch_count') + 1
   //    const repo_full_name = await get_repo_full_name(sql, repo_number)
   //    await pgv.increment('project_size_daily_fetch_count') // take some risk
   //    const repo_project_size = await get_project_size(repo_full_name) // in bytes
   //    if (repo_number % 100 == 0) console.log(`fetched project size (repo ${repo_number})`)
   //    const repository_id = await get_repo_id(sql, repo_full_name)
   //    await sql`UPDATE repository SET project_size = ${repo_project_size} WHERE id = ${repository_id};`
   // }
})

let task_check_github_api_versions = Cron('0 0 * * *', { timezone: 'Asia/Jakarta' }, async () =>  { // “At 00:00.” | https://crontab.guru/#0_0_*_*_*
   const fetch_supported_github_api_versions = async () => {
      const response = await fetch(`https://api.github.com/versions`, github_api_fetch_options); // https://docs.github.com/en/rest/meta/meta?apiVersion=2022-11-28#get-all-api-versions
      const data = await response.json();
      return data
   }
   const supported_api_versions = await fetch_supported_github_api_versions()
   if (!supported_api_versions.includes(github_api_version) || supported_api_versions.length > 1) {
      const log_message = `GitHub API version ${github_api_version} is deprecated. Supported versions: ${supported_api_versions.join(', ')}`
      console.log(log_message)
      await send_to_telegram(log_message)
   }
})

let task_API_requests_per_day = Cron('57 59 23 * * *', { timezone: 'Asia/Jakarta' }, async () => {  // At 23:59:57
   const log_message = `${await pgv.get('visitor_count')}  API requests.`
   console.log(log_message)
   await send_to_telegram(log_message)
   await pgv.set('visitor_count', 0)
})