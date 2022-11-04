import './src/background-jobs.js'

import sql from './src/config/db.js' // https://github.com/porsager/postgres#usage
import server from './src/config/server.js'

server.get('/', (req, res) => {
	res.send('Hello World!')
})

server.get('/repositories', async (req, res) => {
	console.log('GET: /repositories')
	let repos = await sql`
		SELECT
			id, full_name, html_url, description, last_commit_date, stargazers_count, archived, topics, last_verified_at, num_of_closed_pr_since_1_year, num_of_closed_issue_since_1_year,
			sum as top_5_pr_thumbs_up
		FROM repository LEFT JOIN (  -- google "sql joins diagram" | when a repo has no PR, the sum will be null. don't modify this to default to 0 instead of null.
			SELECT
				repository_id,
				CAST (SUM(thumbs_up) as INTEGER)  -- https://stackoverflow.com/a/74231479/9157799
			FROM closed_pr GROUP BY repository_id
		) as total_thumbs_up ON repository.id = total_thumbs_up.repository_id;
	` // TODO: consider a dedicated top_5_pr_thumbs_up column in repository
	repos = repos.map(repo => ({ // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
		...repo, // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals
		last_commit_date: repo.last_commit_date.toISOString().slice(0, 10), // "2022-10-18T00:00:00.000Z" -> "2022-10-18" | https://stackoverflow.com/a/35922073/9157799
		last_verified_at: repo.last_verified_at.toISOString().slice(0, 10), // "2022-10-18T00:00:00.000Z" -> "2022-10-18" | https://stackoverflow.com/a/35922073/9157799
	}))
	res.send(repos)
})