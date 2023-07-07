-- grant select on get_issue_equivalents to web_anon;

-- create function get_issue_equivalents(issue_code varchar(22)) returns setof equiv as $$
-- select *
-- from equiv
-- where equivid = (select equivid
--                  from equiv
--                  where issuecode = issue_code)
--   and issuecode != issue_code
-- $$ language sql;

drop view if exists full_entryurl;
create or replace view full_entryurl as
select eu.entrycode,
       eu.sitecode,
       eu.pagenumber,
       eu.storycode,
       eu.public,
       'https://inducks.org/hr.php?image=' || s.urlbase || eu.url as fullurl
from entryurl eu
         left join lateral (select s.urlbase
                            from site s
                            where s.sitecode = eu.sitecode
    ) as s on true
where eu.sitecode not like 'thumbnails%';



grant select on full_entryurl to web_anon;

drop view if exists equiv_count;
create or replace view equiv_count as
select equiv_outer.issuecode, equiv_outer.equivid, equiv_count
from equiv equiv_outer
         left join lateral (select count(*) as equiv_count
                            from equiv equiv_inner
                            where equiv_outer.equivid = equiv_inner.equivid
                              and equiv_inner.issuecode != equiv_outer.issuecode
    ) as equiv_count on true;
grant select on equiv_count to web_anon;

drop view if exists countrynames_translation;
create or replace view countrynames_translation as
select cn.languagecode, json_object_agg(c.countryname, cn.countryname) as translations
from countryname cn
         left join country c on cn.countrycode = c.countrycode
group by cn.languagecode;
grant select on countrynames_translation to web_anon;


create or replace view equiv_issues as
select equiv_outer.equivid, json_agg(equiv_issue) as issues
from equiv equiv_outer
         left join lateral (select *
                            from equiv equiv_inner
                            where equiv_inner.equivid = equiv_outer.equivid)
    as equiv_issue on true
group by equiv_outer.equivid;


grant select on equiv_issues to web_anon;

select *
from equiv_count;

create or replace function get_issue_equivalents(issue_code character varying)
    returns SETOF inducks.equiv
    language sql
as
$$
select *
from equiv
where equivid in (select equivid
                  from equiv
                  where issuecode = issue_code)
  and issuecode != issue_code
$$;


select *
from equiv equiv_outer
where equivid = (select equivid
                 from equiv equiv_inner
                 where equiv_inner.issuecode = equiv_outer.issuecode)


-- drop view full_issue_url;
-- create or replace view full_issue_url as
drop view issue_with_images cascade;
create or replace view issue_with_images as
select i.*, jsonb_agg(entries) as image_urls
from issue i
         left join lateral (select entry_urls.*
                            from entry e
                                     left join lateral (select *
                                                        from full_entryurl eu
                                                        where eu.entrycode = e.entrycode
                                ) as entry_urls on true
                            where e.issuecode = i.issuecode
                              and e.position = 'a'
    ) as entries on true
-- where issuecode like 'nl/PO3 %'
group by i.issuecode;

grant select on issue_with_images to web_anon;
grant select on issue_with_images to postgres;


drop view issue_images;
create or replace view issue_images as
select e.issuecode, entry_urls.*
from entry e
         left join lateral (select *
                            from full_entryurl eu
                            where eu.entrycode = e.entrycode
    ) as entry_urls on true
  where e.position = 'a';
grant select on issue_images to web_anon;

insert into laravel.owned_issues (issue_code, user_id, created_at)
select issuecode,1, timestamp '2023-01-10 20:00:00' +
                    random() * (timestamp '2023-01-01 20:00:00' -
                                timestamp '2023-09-30 10:00:00')
from inducks.issue
where publicationcode = 'nl/PO3'
order by filledoldestdate desc
on conflict (issue_code, user_id) do
    update set created_at = now(), updated_at = now()

