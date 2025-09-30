export const get_repo_full_name = async (sql, repo_number) => {
   try {
      const [{ full_name }] = await sql` -- https://github.com/porsager/postgres#usage
         SELECT full_name
            FROM (
               SELECT row_number() OVER (ORDER BY stargazers_count DESC), full_name FROM repository
            ) as stupid_alias  -- https://stackoverflow.com/q/14767209/9157799#comment56350360_14767216
            WHERE row_number = ${repo_number};
      `
      return full_name
   } catch (e) {
      console.error(`Error in get_repo_full_name(sql, repo_number: ${repo_number}):\n${e.message}`)
   }
}