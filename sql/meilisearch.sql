set search_path  to inducks;
DROP VIEW IF EXISTS meilisearch_character;
CREATE OR REPLACE VIEW meilisearch_character AS
SELECT MD5("inducks"."character"."charactercode")                      AS "id",
       "inducks"."character"."charactercode",
       "inducks"."character"."charactername",
       "inducks"."character"."official",
       "inducks"."character"."onetime",
       "inducks"."character"."heroonly",
       COALESCE("character_names"."character_names", '{}')             AS "character_names",
       COALESCE("character_entry_names"."character_entry_names", '{}') AS "character_entry_names",
       character_appearances                                           AS "character_appearances_count"
FROM "inducks"."character"
         LEFT JOIN LATERAL (
    SELECT json_object_agg(charactername.languagecode, charactername.charactername) AS "character_names"
    FROM "inducks"."charactername" AS "charactername"
    WHERE "charactername"."charactercode" =
          "inducks"."character"."charactercode") AS "character_names"
                   ON TRUE
         LEFT JOIN LATERAL (
    SELECT array_agg(distinct "entrycharactername"."charactername") AS "character_entry_names"
    FROM "inducks"."entrycharactername" AS "entrycharactername"
    WHERE entrycharactername."charactercode" =
          "inducks"."character"."charactercode") AS "character_entry_names"
                   ON TRUE

         LEFT JOIN LATERAL ( SELECT count(character_appearances) AS "character_appearances"
                             FROM (SELECT "appearance"."charactercode"
                                   FROM "inducks"."appearance" AS "appearance"
                                   WHERE "appearance"."charactercode" =
                                         "inducks"."character"."charactercode") AS "character_appearances" ) AS "character_appearances"
                   ON TRUE;

GRANT SELECT ON meilisearch_character TO auth;

CREATE INDEX md5_charactercode ON character (charactercode);
CREATE INDEX md5_issue ON issue (issuecode);

DROP VIEW IF EXISTS "meilisearch_issue";
CREATE OR REPLACE VIEW "meilisearch_issue" AS
SELECT
    MD5("inducks"."issue"."issuecode") AS "id",
       "inducks"."issue"."issuecode",
       "inducks"."issue"."issuerangecode",
       "inducks"."issue"."publicationcode",
       "inducks"."issue"."title",
       "inducks"."issue"."issuenumber",
       "inducks"."issue"."oldestdate",
       "inducks"."issue"."filledoldestdate",
       "inducks"."issue"."fullyindexed",
       row_to_json("issue_publication_1".*) AS "publication",
       CONCAT("issue_publication_1"."title", ' ', "inducks"."issue"."issuenumber", ' ',
              "inducks"."issue"."title")  AS "full_title",
       get_issue_image_urls("inducks"."issue"."issuecode") as "image_urls"
FROM "inducks"."issue"
         LEFT JOIN LATERAL ( SELECT "publication_1"."publicationcode",
                                    "publication_1"."countrycode",
                                    "publication_1"."languagecode",
                                    "publication_1"."title"
                             FROM "inducks"."publication" AS "publication_1"
                             WHERE "publication_1"."publicationcode" =
                                   "inducks"."issue"."publicationcode" ) AS "issue_publication_1" ON TRUE;

SELECT "inducks"."issue".*, row_to_json("issue_publication_1".*) AS "publication"
FROM "inducks"."issue"
         LEFT JOIN LATERAL ( SELECT "publication_1".*
                             FROM "inducks"."publication" AS "publication_1"
                             WHERE "publication_1"."publicationcode" =
                                   "inducks"."issue"."publicationcode" ) AS "issue_publication_1" ON TRUE
GRANT SELECT ON meilisearch_issue TO web_anon;


ALTER DEFAULT PRIVILEGES IN SCHEMA inducks GRANT SELECT ON TABLES TO web_anon;

