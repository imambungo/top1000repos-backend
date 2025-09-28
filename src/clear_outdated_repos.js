export const clear_outdated_repos = async (sql, date) => {
   const deleted_repos = await sql`DELETE FROM repository WHERE last_verified_at < ${date} RETURNING *;`
   console.log(`cleared ${deleted_repos.length} outdated repos`)
}