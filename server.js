// https://expressjs.com/en/starter/hello-world.html
import express from 'express' // dk usah pake require: https://github.com/porsager/postgres#usage | https://stackoverflow.com/a/64655153/9157799
const server = express()
const port = 3000

server.get('/', (req, res) => {
    res.send('Hello World!')
})

server.listen(port, () => {
    console.log(`server listening on port ${port} (localhost:${port})`)
})


// https://www.npmjs.com/package/node-cron
import cron from 'node-cron';

let task1 = cron.schedule('* * * * *', () => { // 0 12 15 * *
    console.log('running a task 1 every minute');
});


// https://www.npmjs.com/package/node-fetch
//import fetch from 'node-fetch'; // november 2022 bisa pake node 18, native fetch

server.get('/a', async (req, res) => {
    const data = await fetchRepos(1)
    let index = 0
    let repo = data.items[index]
    updateOrInsertRepo(repo)

    res.send(full_name) // data (json) bisa jg
})

const fetchRepos = async (page) => {
    const response = await fetch(`https://api.github.com/search/repositories?q=stars%3A%3E1000&sort=stars&page=${page}&per_page=100`);
    const data = await response.json();
    return data
}

const updateOrInsertRepo = async (repo) => {
    const id = repo.id
    const full_name = repo.full_name
    const owner_avatar_url = repo.owner.avatar_url
    const html_url = repo.html_url
    const description = repo.description
    const last_commit_date = repo.pushed_at.slice(0, 10) // slice 2022-09-14 from 2022-09-14T23:19:32Z
    const stargazers_count = repo.stargazers_count
    const license_key = repo.license.key
    const last_verified_at = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799
}


// https://github.com/porsager/postgres#usage
import sql from './db.js'