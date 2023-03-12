drop view if exists meilisearch_character;
create or replace view meilisearch_character as
SELECT md5("inducks"."character"."charactercode")                      as "id",
       "inducks"."character"."charactercode",
       "inducks"."character"."charactername",
       "inducks"."character"."official",
       "inducks"."character"."onetime",
       "inducks"."character"."heroonly",
       COALESCE("character_names"."character_names", '{}')             AS "character_names",
       COALESCE("character_entry_names"."character_entry_names", '{}') AS "character_entry_names",
       character_appearances                                           as "character_appearances_count"
FROM "inducks"."character"
         LEFT JOIN LATERAL (
    SELECT json_object_agg(charactername.languagecode, charactername.charactername) as "character_names"
    FROM "inducks"."charactername" AS "charactername"
    WHERE "charactername"."charactercode" =
          "inducks"."character"."charactercode") AS "character_names"
                   ON TRUE
         LEFT JOIN LATERAL (
    SELECT array_agg(distinct "entrycharactername"."charactername") as "character_entry_names"
    FROM "inducks"."entrycharactername" AS "entrycharactername"
    WHERE entrycharactername."charactercode" =
          "inducks"."character"."charactercode") AS "character_entry_names"
                   ON TRUE

         LEFT JOIN LATERAL ( SELECT count(character_appearances) AS "character_appearances"
                             FROM (SELECT "appearance"."charactercode"
                                   FROM "inducks"."appearance" AS "appearance"
                                   WHERE "appearance"."charactercode" =
                                         "inducks"."character"."charactercode") AS "character_appearances" ) AS "character_appearances"
                   ON TRUE
order by character_appearances desc;

grant select on meilisearch_character to web_anon;

create index md5_charactercode on character (charactercode);
