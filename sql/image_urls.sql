select e.entrycode, 'https://inducks.org/hr.php?image=' || s.urlbase || e.url as fullurl, e.storycode, e.sitecode
from inducks.entryurl e
         left join inducks.site s on s.sitecode = e.sitecode
where e.entrycode like 'nl/PO3 336a'
  and e.public
  and e.pagenumber = 1
  and e.entrycode like '%a'
--   and e.sitecode not like 'thumbnails%'
--   and (e.sitecode = 'webusers' or e.sitecode = 'nl')
-- where s.urlbase || e.url = 'https://outducks.org/renamed/nl/po3/_134/nl_po3_134a_001.jpg'
order by e.entrycode;

select e.entrycode, 'https://inducks.org/hr.php?image=' || s.urlbase || e.url as fullurl, e.storycode, e.sitecode
from inducks.entryurl e
         left join inducks.site s on s.sitecode = e.sitecode
where s.urlbase || e.url = 'https://outducks.org/webusers/webusers/2011/08/it_pkna_000b_001.jpg'
order by e.entrycode;

select e.entrycode, count(*)
from inducks.entryurl e
         left join inducks.site s on s.sitecode = e.sitecode
where e.entrycode like 'nl/PO3 %'
  and e.public
  and e.pagenumber = 1
  and e.entrycode like '%a'
  and e.sitecode not like 'thumbnails%'
-- where e.entrycode like 'nl/PO3 %' and e.public and e.pagenumber = 1 and e.entrycode like '%a' and (e.sitecode = 'webusers' or e.sitecode = 'nl')
-- where s.urlbase || e.url = 'https://outducks.org/nl/po3/002/nl_po3_002a_001.jpg'
group by e.entrycode
order by e.entrycode;

drop function get_issue_image_urls;
create or replace function get_issue_image_urls(issue_code varchar(22))
    returns text[]
    language plpgsql
as
$$
BEGIN
    return array(
            select 'https://inducks.org/hr.php?image=' || s.urlbase || eu.url as fullurl
            from entryurl eu
                     left join site s on s.sitecode = eu.sitecode
            where eu.sitecode not like 'thumbnails%'
              and eu.entrycode = (
                  select e.entrycode
                  from entry e
                  where e.position = 'a' and e.issuecode = $1
                )
            order by eu.url
        );
END;
$$;

select e.issuecode, e.entrycode
from entry e
where e.position = 'a' and e.entrycode != e.issuecode || 'a';




-- alter function create_role_if_not_exists(name) owner to postgres;
select *
from get_issue_image_urls('nl/PO3 336');


drop function get_story_image_urls;
create or replace function get_story_image_urls(story_code varchar(39))
    returns text[]
    language plpgsql
as
$$
BEGIN
    return array(
            select 'https://inducks.org/hr.php?image=' || s.urlbase || eu.url as fullurl
            from entryurl eu
                     left join site s on s.sitecode = eu.sitecode
            where eu.sitecode not like 'thumbnails%'
              and eu.storycode = $1
            order by eu.url
        );
END;
$$;

drop function get_story_version_image_urls;
create or replace function get_story_version_image_urls(story_version_code varchar(39))
    returns text[]
    language plpgsql
as
$$
BEGIN
    return array(
            select 'https://inducks.org/hr.php?image=' || s.urlbase || eu.url as fullurl
            from entryurl eu
                     left join site s on s.sitecode = eu.sitecode
            where eu.sitecode not like 'thumbnails%'
              and eu.storycode = (
                  select distinct s.storycode
                  from storyversion s
                  where s.storyversioncode = $1
                )
            order by eu.url
        );
END;
$$;
