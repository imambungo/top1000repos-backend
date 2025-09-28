import { github_api_fetch_options } from "./github_api_config.js"

export const get_repo_new_name = async (repo_full_name) => {  // When the name of the repo or owner is changed, the search API can't detect the new name.
   const url = `https://api.github.com/repos/${repo_full_name}`
   const response = await fetch(url, github_api_fetch_options)
   const data = await response.json()
   return data.full_name
}