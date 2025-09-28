export const upsert_repo = async (sql, repo) => {
   const { id, full_name, html_url, description, stargazers_count, open_issues_count, archived, topics, has_issues } = repo
   const license_key = repo.license ? repo.license.key : null
   const last_commit_date = repo.pushed_at.slice(0, 10) // slice 2022-09-14 from 2022-09-14T23:19:32Z
   const owner_avatar_url = repo.owner.avatar_url
   const last_verified_at = new Date().toISOString().slice(0, 10) // https://stackoverflow.com/a/35922073/9157799

   repo = {
      id, full_name, html_url, description, stargazers_count, open_issues_count, archived, topics, has_issues,
      license_key,
      last_commit_date,
      owner_avatar_url,
      last_verified_at
   }
   await sql`
      INSERT INTO repository
         ${sql(repo)}            -- https://github.com/porsager/postgres#dynamic-inserts
      ON CONFLICT (id) DO UPDATE
         SET ${sql(repo)}        -- https://github.com/porsager/postgres#dynamic-columns-in-updates
   ` // https://stackoverflow.com/a/1109198/9157799
}