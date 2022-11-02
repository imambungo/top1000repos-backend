update standalone_data set value = 0 where name != 'server_last_active_date';
-- update standalone_data set value = 0 where name = 'repo_daily_fetch_count';
select * from standalone_data;