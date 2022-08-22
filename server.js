// https://expressjs.com/en/starter/hello-world.html
const express = require('express') // selagi official docs masih make require, gk usah make ES import
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`server listening on port ${port} (localhost:${port})`)
})