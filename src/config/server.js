// https://expressjs.com/en/starter/hello-world.html
import express from 'express' // dk usah pake require: https://stackoverflow.com/a/64655153/9157799
const server = express()

import * as dotenv from 'dotenv' // see https://www.npmjs.com/package/dotenv#usage
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

export default server