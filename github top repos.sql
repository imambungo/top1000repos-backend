/* exported from dbdiagram.io */
CREATE TABLE "repository" (
  "id" int PRIMARY KEY,
  "full_name" varchar UNIQUE NOT NULL,
  "owner_avatar_url" varchar,
  "html_url" varchar UNIQUE NOT NULL,
  "description" varchar NOT NULL,
  "last_commit_date" DATE,
  "stargazers_count" int NOT NULL,
  "license_key" varchar,
  "last_verified_at" DATE NOT NULL
);

CREATE TABLE "topic" (
  "name" varchar PRIMARY KEY,
  "last_verified_at" DATE NOT NULL
);

CREATE TABLE "repository_topic_mapping" (
  "repository_id" int,
  "topic_name" varchar,
  "last_verified_at" DATE NOT NULL,
  PRIMARY KEY ("repository_id", "topic_name")
);

CREATE TABLE "tag" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "repository_tag_mapping" (
  "repository_id" int,
  "tag_id" int,
  PRIMARY KEY ("repository_id", "tag_id")
);

CREATE TABLE "monthly_stars" (
  "repository_id" int,
  "month" DATE,
  "stars" int NOT NULL,
  PRIMARY KEY ("repository_id", "month")
);

CREATE TABLE "closed_pr" (
  "repository_id" int,
  "id" int,
  "closed_date" DATE NOT NULL,
  "thumbs_up" int NOT NULL,
  PRIMARY KEY ("repository_id", "id")
);

CREATE TABLE "open_issue" (
  "repository_id" int,
  "id" int,
  "thumbs_up" int NOT NULL,
  PRIMARY KEY ("repository_id", "id")
);

CREATE TABLE "parent_child_mapping" (
  "parent_id" int,
  "child_id" int,
  PRIMARY KEY ("parent_id", "child_id")
);

CREATE TABLE "siblings_mapping" (
  "repository_id" int,
  "sibling_id" int,
  PRIMARY KEY ("repository_id", "sibling_id")
);

CREATE TABLE "alternatives_mapping" (
  "repository_id" int,
  "alternative_id" int,
  PRIMARY KEY ("repository_id", "alternative_id")
);

ALTER TABLE "repository_topic_mapping" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "repository_topic_mapping" ADD FOREIGN KEY ("topic_name") REFERENCES "topic" ("name") ON DELETE CASCADE;

ALTER TABLE "repository_tag_mapping" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "repository_tag_mapping" ADD FOREIGN KEY ("tag_id") REFERENCES "tag" ("id") ON DELETE CASCADE;

ALTER TABLE "monthly_stars" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "closed_pr" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "open_issue" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "parent_child_mapping" ADD FOREIGN KEY ("parent_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "parent_child_mapping" ADD FOREIGN KEY ("child_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "siblings_mapping" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "siblings_mapping" ADD FOREIGN KEY ("sibling_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "alternatives_mapping" ADD FOREIGN KEY ("repository_id") REFERENCES "repository" ("id") ON DELETE CASCADE;

ALTER TABLE "alternatives_mapping" ADD FOREIGN KEY ("alternative_id") REFERENCES "repository" ("id") ON DELETE CASCADE;
