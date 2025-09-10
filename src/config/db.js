import * as dotenv from 'dotenv' // see https://www.npmjs.com/package/dotenv#usage
dotenv.config()

import postgres from 'postgres' // https://github.com/porsager/postgres

const create_sql_wrapper = async () => { // because of ECONNRESET | https://github.com/porsager/postgres/issues/179
   const pass_by_reference = {
      sql: postgres() // https://github.com/porsager/postgres#postgresurl-options | Options will fall back to psql environment variables: https://github.com/porsager/postgres#environmental-variables | https://www.postgresql.org/docs/current/libpq-envars.html
   }
   await pass_by_reference.sql`SELECT 1;` // if the password is wrong, throw error as early as possible. Postgres.js doesn't check the validity of the options right away. | https://stackoverflow.com/a/3670000/9157799

   const sql_wrapper = (...args) => { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
      return pass_by_reference.sql(...args) // FYI: The async and await can be omitted. In fact, they should be omitted: https://github.com/porsager/postgres?tab=readme-ov-file#dynamic-inserts
   }

   // search in IDE for "sql."
   sql_wrapper.file = pass_by_reference.sql.file
   sql_wrapper.end  = pass_by_reference.sql.end

   sql_wrapper.reinstantiate = async () => { // to be called when ECONNRESET is caught in a try-catch | https://github.com/porsager/postgres/issues/179
      await pass_by_reference.sql.end()
      pass_by_reference.sql = postgres() // https://github.com/porsager/postgres?tab=readme-ov-file#connection_ended

      // search in IDE for "sql."
      sql_wrapper.file = pass_by_reference.sql.file
      sql_wrapper.end  = pass_by_reference.sql.end
   }

   return sql_wrapper
}

const sql = await create_sql_wrapper()

export default sql