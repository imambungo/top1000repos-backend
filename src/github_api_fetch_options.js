export const github_api_version = '2022-11-28'
const api_request_headers = {  // https://trello.com/c/MgI1fvc5 | https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax
   'X-GitHub-Api-Version': github_api_version,               // https://docs.github.com/en/rest/overview/api-versions?apiVersion=2022-11-28#specifying-an-api-version
   'User-Agent': 'imambungo',                                // https://docs.github.com/en/rest/overview/resources-in-the-rest-api?apiVersion=2022-11-28#user-agent-required
   'Authorization': `Bearer ${process.env.GITHUB_API_TOKEN}` // https://docs.github.com/en/rest/overview/authenticating-to-the-rest-api?apiVersion=2022-11-28
}
export const github_api_fetch_options = {headers: api_request_headers} // https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax