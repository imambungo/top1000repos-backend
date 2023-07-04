// https://expressjs.com/en/starter/hello-world.html
import express from 'express' // dk usah pake require: https://stackoverflow.com/a/64655153/9157799
const server = express()

import * as dotenv from 'dotenv' // see https://www.npmjs.com/package/dotenv#usage
dotenv.config()

const port = process.env.PORT
//server.listen(port, '0.0.0.0') // https://stackoverflow.com/a/33957043/9157799
server.listen(port, () => { // railway.app: Looks like your app is listening on 127.0.0.1. You may need to listen on 0.0.0.0 instead.
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