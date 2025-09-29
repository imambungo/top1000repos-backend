-- exported from dbdiagram.io
CREATE TABLE "repository" (
  "id" int PRIMARY KEY,
  "full_name" varchar UNIQUE NOT NULL,
  "owner_avatar_url" varchar,
  "html_url" varchar UNIQUE NOT NULL,
  "description" varchar,
  "last_commit_date" DATE,
  "stargazers_count" int NOT NULL,
  "license_key" varchar,
  "last_verified_at" DATE NOT NULL,
  "topics" varchar[] NOT NULL,
  "archived" boolean NOT NULL,
  "num_of_closed_pr_since_1_year" int,
  "num_of_closed_issues_since_1_year" int,
  "total_thumbs_up_of_top_5_closed_pr_since_1_year" int,
  "total_thumbs_up_of_top_5_open_issue_of_all_time" int,
  "total_thumbs_up_of_top_5_closed_issues_since_1_year" int,
  "has_issues" boolean NOT NULL,
  "code_size" bigint,
  "project_size" bigint,
  "repo_size" bigint NOT NULL
);

CREATE TABLE "persistent_global_variable" (
  "name" varchar PRIMARY KEY,
  "value" varchar NOT NULL
);