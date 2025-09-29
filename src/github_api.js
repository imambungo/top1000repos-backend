import { github_api_fetch_options } from "./github_api_config.js"

// The search API has custom rate limit, 30 requests per minute: https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#rate-limit

export const fetch_repos = async (page) => {
   const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`, github_api_fetch_options); // https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax
   const data = await response.json();
   return data
}

export const fetch_top_5_closed_issues_since = async (repo_full_name, date) => { // fetch top 5 closed issues of the last 365 days
   const url = `https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:issue%20closed:%3E${date}%20repo:${repo_full_name}`
   const response = await fetch(url, github_api_fetch_options) // https://trello.com/c/aPVztlM3/8-fetch-api-get-top-5-closed-possibly-merged-prs-of-the-last-12-months
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

export const fetch_top_5_closed_PR_since = async (repo_full_name, date) => { // fetch top 5 closed PR of the last 365 days
   const url = `https://api.github.com/search/issues?sort=reactions-%2B1&per_page=5&q=state:closed%20type:pr%20closed:%3E${date}%20repo:${repo_full_name}`
   const response = await fetch(url, github_api_fetch_options) // https://trello.com/c/aPVztlM3/8-fetch-api-get-top-5-closed-possibly-merged-prs-of-the-last-12-months
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

export const get_code_size = async (repo_full_name) => {
   const url = `https://api.github.com/repos/${repo_full_name}/languages` // https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-languages
   const response = await fetch(url)
   const data = await response.json()

   let total_bytes = 0
   for (const [language, bytes] of Object.entries(data)) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
      total_bytes += bytes
   }

   return total_bytes
}

export const get_project_size = async (repo_full_name) => {
   const get_default_branch = async (repo_full_name) => {
      const url = `https://api.github.com/repos/${repo_full_name}`
      const response = await fetch(url)
      const data = await response.json()
      return data.default_branch
   }
   const default_branch = await get_default_branch(repo_full_name)

   let total_api_call = 0
   const get_tree_size = async (repo_full_name, tree, parent) => {
      const recursive_tree = async (repo_full_name, tree) => {
         const url = `https://api.github.com/repos/${repo_full_name}/git/trees/${tree}?recursive=1` // https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#get-a-tree
         const response = await fetch(url)
         const data = await response.json()
         return data
      }
      const data = await recursive_tree(repo_full_name, tree)
      total_api_call += 1

      if (!data.truncated) {
         const files = data.tree.filter(row => row.type == 'blob')
         const files_bytes = files.reduce((accumulator, row) => {
            return accumulator + row.size
         }, 0) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
         if (parent.includes('/')) // don't print if non-recursive trees are not needed at all
            console.log(`${parent}  ${files.length} files: ${files_bytes} bytes`)
         return files_bytes
      } else {
         console.log(`${parent} (truncated)`)
         const non_recursive_tree = async (repo_full_name, tree) => {
            const url = `https://api.github.com/repos/${repo_full_name}/git/trees/${tree}` // https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#get-a-tree
            const response = await fetch(url)
            const data = await response.json()
            return data
         }
         const data = await non_recursive_tree(repo_full_name, tree)
         total_api_call += 1

         const trees = data.tree.filter(row => row.type == 'tree')
         let trees_bytes = 0
         for (let i = 0; i < trees.length; i++) {
            trees_bytes += await get_tree_size(repo_full_name, trees[i].sha, `${parent}${trees[i].path}/`)
         }

         const files = data.tree.filter(row => row.type == 'blob')
         const files_bytes = files.reduce((accumulator, row) => {
            return accumulator + row.size
         }, 0) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce

         console.log (`${parent}  ${trees_bytes+files_bytes} bytes`)
         return trees_bytes + files_bytes
      }
   }
   const total_size = await get_tree_size(repo_full_name, default_branch, `${default_branch}:`)
   if (total_api_call > 1) console.log(`total api call: ${total_api_call}`)

   return total_size
}

export const fetch_repo_new_name = async (repo_full_name) => {  // When the name of the repo or owner is changed, the search API can't detect the new name.
   const url = `https://api.github.com/repos/${repo_full_name}`
   const response = await fetch(url, github_api_fetch_options)
   const data = await response.json()
   return data.full_name
}