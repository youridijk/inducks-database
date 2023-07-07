set search_path to inducks;
DROP VIEW IF EXISTS meilisearch_character;
CREATE OR REPLACE VIEW meilisearch_character AS
SELECT MD5(character.charactercode)                                AS id,
       character.charactercode,
       character.charactername,
       character.official,
       character.onetime,
       character.heroonly,
       COALESCE(character_names.character_names, '{}')             AS character_names,
       COALESCE(character_entry_names.character_entry_names, '{}') AS character_entry_names,
       character_appearances                                       AS character_appearances_count
FROM character
         LEFT JOIN LATERAL (SELECT json_object_agg(charactername.languagecode,
                                                   charactername.charactername) AS character_names
                            FROM charactername AS charactername
                            WHERE charactername.charactercode =
                                  character.charactercode) AS character_names
                   ON TRUE

         LEFT JOIN LATERAL (SELECT array_agg(distinct entrycharactername.charactername) AS character_entry_names
                            FROM entrycharactername AS entrycharactername
                            WHERE entrycharactername.charactercode =
                                  character.charactercode) AS character_entry_names
                   ON TRUE

         LEFT JOIN LATERAL ( SELECT count(character_appearances) AS character_appearances
                             FROM (SELECT appearance.charactercode
                                   FROM appearance AS appearance
                                   WHERE appearance.charactercode =
                                         character.charactercode) AS character_appearances ) AS character_appearances
                   ON TRUE;

GRANT SELECT ON meilisearch_character TO auth;

CREATE INDEX md5_charactercode ON character (charactercode);
CREATE INDEX md5_issue ON issue (issuecode);

DROP VIEW IF EXISTS meilisearch_issue;
CREATE OR REPLACE VIEW meilisearch_issue AS
SELECT MD5(i.issuecode)                                                  AS id,
       i.issuecode,
       i.issuerangecode,
       i.publicationcode,
       i.title                                                           AS issue_title,
       i.issuenumber,
       i.oldestdate,
       i.filledoldestdate,
       i.fullyindexed,
       issue_publication.title                                           AS publicaton_title,
       issue_publication.title || ' ' || i.issuenumber                   AS publication_title_issue_number,
       CONCAT(issue_publication.title, ' ', i.issuenumber, ' ', i.title) AS full_title,
       issue_publication.countrycode                                     AS countrycode,
       issue_publication.countryname                                     AS countryname,
       issue_publication.languagecode                                    AS languagecode,
       issue_publication.category                                        AS category,
       issue_publication.filter_categories                               AS filter_categories,
       image_urls.*
FROM issue i
         LEFT JOIN LATERAL ( SELECT jsonb_agg(i) AS image_urls
                             FROM get_issue_image_urls(i.issuecode) i
    ) AS image_urls ON TRUE

         LEFT JOIN LATERAL ( SELECT p.publicationcode,
                                    p.countrycode,
                                    p.languagecode,
                                    p.title,
                                    publication_country.countryname,
                                    publication_category.*

                             FROM publication AS p

                                      LEFT JOIN LATERAL ( SELECT *
                                                          FROM country c
                                                          WHERE c.countrycode = p.countrycode
                                 ) AS publication_country ON TRUE

                                      LEFT JOIN LATERAL ( SELECT category, coalesce(string_to_array(lower(category), ' '), '{}') AS filter_categories
                                                          FROM publicationcategory pc
                                                          where pc.publicationcode = p.publicationcode
                                 ) as publication_category ON TRUE

                             WHERE p.publicationcode =
                                   i.publicationcode


    ) AS issue_publication ON TRUE;

GRANT SELECT ON meilisearch_issue TO web_anon;

CREATE INDEX meilisearch_filter_category ON publicationcategory(coalesce(string_to_array(lower(category), ' '), '{}'));
drop index meilisearch_filter_category;

ALTER DEFAULT PRIVILEGES IN SCHEMA inducks GRANT SELECT ON TABLES TO web_anon;
