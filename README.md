### 1. `npm install`

### 2. Setup database

1. Use default user *postgres*.
1. [Change user *postgres*'s password](https://stackoverflow.com/a/45965928/9157799).
1. Create database "github_top_repos".
1. [`npm run init-db-schema`](https://docs.npmjs.com/cli/using-npm/scripts)

### 3. Setup environment variables

```
HOST='http://localhost'
PORT=3000

PGUSER='postgres'
PGPASSWORD="devgithub_top_repos"
PGDATABASE='github_top_repos'

GITHUB_API_TOKEN='blablablaSomethingsomething'
FRONTEND_ORIGIN='http://localhost:5173'
```

### 4. Start server with [`npm start`, `node server.js`, or `node .`](https://docs.npmjs.com/cli/commands/npm-start)