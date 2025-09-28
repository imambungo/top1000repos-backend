import { github_api_fetch_options } from "./github_api_config.js"

export const fetch_repos = async (page) => {
   const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`, github_api_fetch_options); // https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax
   const data = await response.json();
   return data
}

export const get_repo_new_name = async (repo_full_name) => {  // When the name of the repo or owner is changed, the search API can't detect the new name.
   const url = `https://api.github.com/repos/${repo_full_name}`
   const response = await fetch(url, github_api_fetch_options)
   const data = await response.json()
   return data.full_name
}