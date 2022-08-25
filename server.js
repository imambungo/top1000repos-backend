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
import fetch from 'node-fetch'; // november 2022 bisa pake node 18, native fetch

server.get('/a', async (req, res) => {
    const response = await fetch('https://api.github.com/search/repositories?q=stars%3A%3E18000&sort=stars&page=1&per_page=100');
    const data = await response.json();
    const full_name = data.items[0].full_name
    res.send(full_name) // data (json) bisa jg
})


// https://github.com/porsager/postgres#usage
import sql from './db.js'