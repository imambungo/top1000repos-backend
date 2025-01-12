### 1. `npm install`

### 2. Setup environment variables

```
# for the server
HOST='http://localhost'
PORT=3000
FRONTEND_ORIGIN='http://localhost:5173'

# for database: https://github.com/porsager/postgres?tab=readme-ov-file#environmental-variables
PGUSER='postgres'              # on local environment, will default to current terminal user instead of postgres
PGPASSWORD="postgres"          # for most Unix distributions, there's no default password. It looks like Postgres.js require a password? https://github.com/porsager/postgres/issues/308
PGDATABASE='github_top_repos'  # on local environment, we typically need multiple db name for multiple projects.

GITHUB_API_TOKEN='blablablaSomethingsomething'
```

### 3. Setup database

1. Use default user *postgres*.
1. [Add/change user *postgres*'s password](https://stackoverflow.com/a/45965928/9157799).
1. Create database "github_top_repos".
1. [`npm run init-db-schema`](https://docs.npmjs.com/cli/using-npm/scripts)

### 4. Start server with [`npm start`, `node server.js`, or `node .`](https://docs.npmjs.com/cli/commands/npm-start)