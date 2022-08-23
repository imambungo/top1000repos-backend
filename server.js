// https://expressjs.com/en/starter/hello-world.html
const express = require('express') // selagi official docs masih make require, gk usah make ES import
const server = express()
const port = 3000

server.get('/', (req, res) => {
    res.send('Hello World!')
})

server.listen(port, () => {
    console.log(`server listening on port ${port} (localhost:${port})`)
})


// https://www.npmjs.com/package/node-cron
var cron = require('node-cron');

let task1 = cron.schedule('* * * * *', () => {
    console.log('running a task 1 every minute');
});


// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch') // november 2022 bisa pake node 18, native fetch

server.get('/a', async (req, res) => {
    const response = await fetch('https://api.github.com/search/repositories?q=stars%3A%3E18000&sort=stars&page=1&per_page=100');
    const data = await response.json();
    res.send(data)
})