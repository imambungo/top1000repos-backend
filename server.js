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
}, {
    scheduled: false
});

let task2 = cron.schedule('* * * * *', () => {
    console.log('running another task 2 every minute');
});

server.get('/start-task1', (req, res) => {
    res.send('starting task 1')
    task1.start()
})

server.get('/stop-task2', (req, res) => {
    res.send('stopping task 2')
    task2.stop()
})