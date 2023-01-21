-- exported from dbdiagram.io
-- important! don't use serial: https://stackoverflow.com/a/73496296/9157799
-- modify the generated file first! https://community.dbdiagram.io/t/auto-increment-field/75/6?u=imambungo
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
  "num_of_closed_issue_since_1_year" int
);

CREATE TABLE "monthly_stars" (
  "repository_id" int,
  "month" DATE,
  "stars" int NOT NULL,
  PRIMARY KEY ("repository_id", "month")
);

CREATE TABLE "standalone_data" (
  "name" varchar PRIMARY KEY,
  "value" varchar NOT NULL
);

ALTER TABLE "monthly_stars" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;
