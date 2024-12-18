// https://expressjs.com/en/starter/hello-world.html
import express from 'express' // no need to use require: https://stackoverflow.com/a/64655153/9157799
const server = express()

import * as dotenv from 'dotenv' // see https://www.npmjs.com/package/dotenv#%EF%B8%8F-usage
dotenv.config()

const port = process.env.PORT
server.listen(port, () => {
	console.log(`server listening on port ${port} (${process.env.HOST}:${port})`)
})

import cors from 'cors' // https://www.npmjs.com/package/cors#usage
const corsOptions = {
	origin: process.env.FRONTEND_ORIGIN,
	optionsSuccessStatus: 200
}
server.use(cors(corsOptions))

import compression from 'compression' // https://www.npmjs.com/package/compression#expressconnect
server.use(compression())

server.use(express.json()) // for parsing application/json req.body | https://stackoverflow.com/a/43626891/9157799

server.set('trust proxy', true) // to get ip address even when using a reverse proxy | https://stackoverflow.com/a/45415758/9157799

export default server