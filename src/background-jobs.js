import Cron from 'croner' // https://www.npmjs.com/package/croner
import { today, a_year_ago } from './lib/date.js'

let G_fetch_quota = 10 // fetch quota per minute | G marks a global variable
let task1 = Cron('* * * * *', () => { // every minute, reset fetch quota
   G_fetch_quota = 10
});

import sql from './config/db.js' // https://github.com/porsager/postgres#usage
import persistent_global_variable from './lib/persistent_global_variable.js'
const pgv = persistent_global_variable(sql)

import { send_to_telegram } from './lib/send_to_telegram.js'

const githubApiVersion = '2022-11-28'
const apiRequestHeaders = {  // https://trello.com/c/MgI1fvc5 | https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax
   'X-GitHub-Api-Version': githubApiVersion,                 // https://docs.github.com/en/rest/overview/api-versions?apiVersion=2022-11-28#specifying-an-api-version
   'User-Agent': 'imambungo',                                // https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#user-agent-required
   'Authorization': `Bearer ${process.env.GITHUB_API_TOKEN}` // https://docs.github.com/en/rest/overview/authenticating-to-the-rest-api?apiVersion=2022-11-28
}
const fetchOptions = {headers: apiRequestHeaders} // https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax

let taskFetchGithubApi = Cron('*/9 * * * * *', { timezone: 'Etc/UTC' }, async () => {  // every 9 second | https://stackoverflow.com/a/59800039/9157799 | https://crontab.guru/
   if (G_fetch_quota > 0) {
      const get_repo_new_name = async (repo_full_name) => {  // When the name of the repo or owner is changed, the search API can't detect the new name.
         const url = `https://api.github.com/repos/${repo_full_name}`
         const response = await fetch(url, fetchOptions)
         const data = await response.json()
         return data.full_name
      }

      if (await pgv.get('server_last_active_date') != today()) { // in UTC: https://stackoverflow.com/a/74234498/9157799 | different SQL statement should be splitted: https://github.com/porsager/postgres/issues/86#issuecomment-668217732
         pgv.set('repo_daily_fetch_count', 0)
         pgv.set('top_5_closed_pr_daily_fetch_count', 0)
         pgv.set('top_5_closed_issues_daily_fetch_count', 0)
         pgv.set('top_5_open_issues_daily_fetch_count', 0)
         pgv.set('server_last_active_date', today())
      } else if (await pgv.get('repo_daily_fetch_count') < 10) { // fetch repos and stuff
         const fetch_repos = async (page) => {
            const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`, fetchOptions); // https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax
            const data = await response.json();
            return data
         }

         const upsert_repo = async (sql, repo) => {
            const { id, full_name, html_url, description, stargazers_count, open_issues_count, archived, topics, has_issues } = repo
            const license_key = repo.license ? repo.license.key : null
            const last_commit_date = repo.pushed_at.slice(0, 10) // slice 2022-09-14 from 2022-09-14T23:19:32Z
            const owner_avatar_url = repo.owner.avatar_url
            const last_verified_at = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
         
            repo = {
               id, full_name, html_url, description, stargazers_count, open_issues_count, archived, topics, has_issues,
               license_key,
               last_commit_date,
               owner_avatar_url,
               last_verified_at
            }
            await sql`
               INSERT INTO repository
                  ${sql(repo)}            -- https://github.com/porsager/postgres#dynamic-inserts
               ON CONFLICT (id) DO UPDATE
                  SET ${sql(repo)}        -- https://github.com/porsager/postgres#dynamic-columns-in-updates
            ` // https://stackoverflow.com/a/1109198/9157799
         }

         const clear_outdated_repos = async (sql, date) => {
            const deletedRepos = await sql`DELETE FROM repository WHERE last_verified_at < ${date} RETURNING *;`
            console.log(`cleared ${deletedRepos.length} outdated repos`)
         }

         const page_to_fetch = await pgv.get('repo_daily_fetch_count') + 1
         const { items: repos } = await fetch_repos(page_to_fetch) // https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=1&per_page=100
         G_fetch_quota--
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
         const fetch_top_5_closed_PR_since = async (repo_full_name, date) => { // fetch top 5 closed PR of the last 365 days
            const url = `https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:pr%20closed:%3E${date}%20repo:${repo_full_name}`
            const response = await fetch(url, fetchOptions) // https://trello.com/c/aPVztlM3/8-fetch-api-get-top-5-closed-possibly-merged-prs-of-the-last-12-months
            const data = await response.json()
            if (!response.ok) { // https://stackoverflow.com/a/38236296/9157799
               // MAYBE TODO: When
               //               "The listed users and repositories cannot be searched either because the resources do not exist or you do not have permission to view them."
               //             then delete the repo from the database. Restarting the app won't remove it from the db unless it's been 24 hours. See clear_outdated_repos()
               let error_message = 'ERROR'
               error_message += '\n------------------------------'
               error_message += '\nfetch_top_5_closed_PR_since()'
               error_message += `\nrepo_full_name: ${repo_full_name}`
               error_message += `\ndate          : ${date}`
               error_message += `\nurl           : ${url}`
               error_message += `\nJSON          : ${JSON.stringify(data, null, 2)}` // https://stackoverflow.com/q/5612787/9157799#comment53474797_5612849
               error_message += '\n------------------------------'
               throw error_message
            }
            return data
         }

         const repo_number = await pgv.get('top_5_closed_pr_daily_fetch_count') + 1
         const repo_full_name = await get_repo_full_name(sql, repo_number)
         let num_of_closed_pr_since_1_year, top_5_closed_pr // https://stackoverflow.com/q/59416204/9157799
         try {
            ;( { total_count: num_of_closed_pr_since_1_year, items: top_5_closed_pr } = await fetch_top_5_closed_PR_since(repo_full_name, a_year_ago()) ) // https://stackoverflow.com/q/59416204/9157799
         } catch (e) {
            console.log(e)
            const repo_new_name = await get_repo_new_name(repo_full_name)
            await sql`UPDATE repository SET full_name = ${repo_new_name} WHERE full_name = ${repo_full_name}`
            return
         }
         G_fetch_quota--
         const repository_id = await get_repo_id(sql, repo_full_name)
         let total_thumbs_up_of_top_5_closed_pr_since_1_year = 0
         top_5_closed_pr.forEach(pr => total_thumbs_up_of_top_5_closed_pr_since_1_year += pr.reactions['+1'])
         await pgv.increment('top_5_closed_pr_daily_fetch_count')
         if (repo_number % 400 == 0) console.log(`fetched top 5 closed PR (repo ${repo_number})`)
         await sql`UPDATE repository SET num_of_closed_pr_since_1_year = ${num_of_closed_pr_since_1_year}, total_thumbs_up_of_top_5_closed_pr_since_1_year = ${total_thumbs_up_of_top_5_closed_pr_since_1_year} WHERE id = ${repository_id};`
      } else if (await pgv.get('top_5_closed_issues_daily_fetch_count') < 1000) { // fetch top 5 CLOSED ISSUES and stuff
         const fetch_top_5_closed_issues_since = async (repo_full_name, date) => { // fetch top 5 closed issues of the last 365 days
            const url = `https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:issue%20closed:%3E${date}%20repo:${repo_full_name}`
            const response = await fetch(url, fetchOptions) // https://trello.com/c/aPVztlM3/8-fetch-api-get-top-5-closed-possibly-merged-prs-of-the-last-12-months
            const data = await response.json()
            if (!response.ok) { // https://stackoverflow.com/a/38236296/9157799
               let error_message = 'ERROR'
               error_message += '\n---------------------------------'
               error_message += '\nfetch_top_5_closed_issues_since()'
               error_message += `\nrepo_full_name: ${repo_full_name}`
               error_message += `\ndate          : ${date}`
               error_message += `\nurl           : ${url}`
               error_message += `\nJSON          : ${JSON.stringify(data, null, 2)}` // https://stackoverflow.com/q/5612787/9157799#comment53474797_5612849
               error_message += '\n---------------------------------'
               throw error_message
            }
            return data
         }

         const repo_number = await pgv.get('top_5_closed_issues_daily_fetch_count') + 1
         const repo_full_name = await get_repo_full_name(sql, repo_number)
         let num_of_closed_issues_since_1_year, top_5_closed_issues // https://stackoverflow.com/q/59416204/9157799
         try {
            ;( { total_count: num_of_closed_issues_since_1_year, items: top_5_closed_issues } = await fetch_top_5_closed_issues_since(repo_full_name, a_year_ago()) ) // https://stackoverflow.com/q/59416204/9157799
         } catch (e) {
            console.log(e)
            const repo_new_name = await get_repo_new_name(repo_full_name)
            await sql`UPDATE repository SET full_name = ${repo_new_name} WHERE full_name = ${repo_full_name}`
            return
         }
         G_fetch_quota--
         const repository_id = await get_repo_id(sql, repo_full_name)
         let total_thumbs_up_of_top_5_closed_issues_since_1_year = 0
         top_5_closed_issues.forEach(issue => total_thumbs_up_of_top_5_closed_issues_since_1_year += issue.reactions['+1'])
         await pgv.increment('top_5_closed_issues_daily_fetch_count')
         if (repo_number % 400 == 0) console.log(`fetched top 5 closed issues (repo ${repo_number})`)
         await sql`UPDATE repository SET num_of_closed_issues_since_1_year = ${num_of_closed_issues_since_1_year}, total_thumbs_up_of_top_5_closed_issues_since_1_year = ${total_thumbs_up_of_top_5_closed_issues_since_1_year} WHERE id = ${repository_id};`
      }
   }
})

let taskCheckGithubApiVersions = Cron('59 4 * * *', async () =>  { // “At 04:59.” | with 10 fetch per minute, 2000 need 200 minute or 3 hr 20 min. | https://crontab.guru/#59_4_*_*_*
   console.log(`current GitHub API version: ${githubApiVersion}`)
   const fetch_github_api_versions = async () => {
      const response = await fetch(`https://api.github.com/versions`, fetchOptions); // https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax
      const data = await response.json();
      return data
   }
   console.log(await fetch_github_api_versions())
})

let task_API_requests_per_day = Cron('57 59 23 * * *', async () => {  // At 23:59:57
   const log_message = `${today()}  ${await pgv.get('visitor_count')}  API requests.`
   console.log(log_message)
   await send_to_telegram(log_message)
   await pgv.set('visitor_count', 0)
})

const get_repo_full_name = async (sql, repo_number) => {
   const [{ full_name }] = await sql` -- https://github.com/porsager/postgres#usage
      SELECT full_name
         FROM (
            SELECT row_number() OVER (ORDER BY stargazers_count DESC), full_name FROM repository
         ) as stupid_alias  -- https://stackoverflow.com/q/14767209/9157799#comment56350360_14767216
         WHERE row_number = ${repo_number};
   `
   return full_name
}

const get_repo_id = async (sql, repo_full_name) => {
   const [{ id: repo_id }] = await sql`SELECT id FROM repository WHERE full_name = ${repo_full_name}` // https://github.com/porsager/postgres#usage
   return repo_id
}