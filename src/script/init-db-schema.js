import 'dotenv/config' // https://www.npmjs.com/package/dotenv#%EF%B8%8F-usage

// https://github.com/porsager/postgres#usage
import sql from '../config/db.js'

await sql.file('./src/github top repos.sql') // the schema | use path relative to project root | https://stackoverflow.com/q/70265259/9157799

await sql.end()