-- to be used using this vscode extension: https://marketplace.visualstudio.com/items?itemName=ckolkman.vscode-postgres

-- update persistent_global_variable set value = 0 where name != 'server_last_active_date';
-- update persistent_global_variable set value = 0 where name = 'repo_daily_fetch_count';
select * from persistent_global_variable;