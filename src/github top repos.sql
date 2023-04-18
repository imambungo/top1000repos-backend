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
  "open_issues_count" int NOT NULL,
  "topics" varchar[] NOT NULL,
  "archived" boolean NOT NULL,
  "num_of_closed_pr_since_1_year" int,
  "num_of_closed_issues_since_1_year" int,
  "total_thumbs_up_of_top_5_closed_pr_since_1_year" int,
  "total_thumbs_up_of_top_5_open_issue_of_all_time" int,
  "num_of_open_pr_of_all_time" int,
  "total_thumbs_up_of_top_5_closed_issues_since_1_year" int,
  "has_issues" boolean NOT NULL
);

CREATE TABLE "monthly_stars" (
  "repository_id" int,
  "month" DATE,
  "stars" int NOT NULL,
  PRIMARY KEY ("repository_id", "month")
);

CREATE TABLE "persistent_global_variable" (
  "name" varchar PRIMARY KEY,
  "value" varchar NOT NULL
);

ALTER TABLE "monthly_stars" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;
