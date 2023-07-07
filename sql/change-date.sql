update issue
set filledoldestdate = left(filledoldestdate, 8) || '28'
where filledoldestdate like '%02-31';

update issue
set filledoldestdate = left(filledoldestdate, 8) || '30'
where filledoldestdate similar to '\d{4}-(\d(4|6|9)|11)-31';



update issue
set filledoldestdate = left(filledoldestdate, 8) || '01'
where filledoldestdate like '%-00';

update issue
set filledoldestdate = '2006-09-30'
where filledoldestdate = '2006-19-30';

alter table issue
    alter column filledoldestdate type date
        using filledoldestdate::date;

select filledoldestdate, (left(filledoldestdate, 8) || '30')::date
from issue
where filledoldestdate similar to '\d{4}-(\d(4|6|9)|11)-31';


select filledoldestdate, left(filledoldestdate, 8) || '01'
from issue
where filledoldestdate like '%-00';

select filledoldestdate
from issue
where filledoldestdate like '%-19-%';


-- create or replace view test as

drop function get_issue_stories cascade;
create or replace function
    get_issue_stories(issue_code varchar(22))
    returns table
            (
                entrycode               varchar(22),
                original_entry_urls     json,
                storyversion_entry_urls json
            )
    language plpgsql
as
$$
BEGIN
    return query (select e.entrycode,
                         original_entry_urls.* as original_entry_urls,
                         story_versions.*
                  from entry e
                           left join lateral ( select json_agg(eu.*) as entry_urls
                                               from full_entryurl eu
                                               where eu.entrycode = e.entrycode
                      ) as orginal_entry_urls on true

                           left join lateral (select sv_story.storycode, sv_story.originalstoryversioncode
                                              from storyversion sv
                                                       left join lateral ( select s.storycode, s.originalstoryversioncode
                                                                           from story s
                                                                           where s.storycode = sv.storyversioncode

                                                  ) as sv_story on true

                                              where e.storyversioncode = sv.storyversioncode

                      ) as original_story2 on true
                           left join lateral ( select json_agg(entries.full_entry_urls
                                                      order by entries.filledoldestdate)
                                                      filter ( where entries.full_entry_urls is not null ) as storyversion_entry_urls
                                               from storyversion sv
                                                        left join lateral ( select *,
                                                                                   full_entry_urls as full_entry_urls
                                                                            from entry e
                                                                                     left join lateral ( select *
                                                                                                         from full_entryurl fe
                                                                                                         where fe.entrycode = e.entrycode
                                                                                                           and public) as full_entry_urls
                                                                                               on true
                                                                                     left join lateral ( select filledoldestdate
                                                                                                         from issue i
                                                                                                         where i.issuecode = e.issuecode) as entry_issue
                                                                                               on true
                                                                            where e.storyversioncode = sv.storyversioncode
                                                   ) as entries on true

                                               where sv.storycode = original_story2.storycode) as story_versions
                                     on true
                  where e.issuecode = issue_code);
END;
$$;



drop view entry_with_images;
grant select on entry_with_images to web_anon;
create or replace view entry_with_images as
select e.*,
       original_entry_urls.original_entry_urls,
       story_versions.story_entry_urls
from entry e
         left join lateral ( select json_agg(eu) as original_entry_urls
                             from entryurl eu
                             where eu.entrycode = e.entrycode
    ) as original_entry_urls on true

         left join lateral (select sv.storycode
                            from storyversion sv
                            where e.storyversioncode = sv.storyversioncode
    ) as entry_storyversion on true

         left join lateral ( select json_agg(entries.full_entry_urls
                                    order by entries.filledoldestdate)
                                    filter ( where entries.full_entry_urls is not null )
                                        as story_entry_urls
                             from storyversion sv
                                      left join lateral ( select entry_issue.filledoldestdate,
                                                                 full_entry_urls as full_entry_urls
                                                          from entry e
                                                                   left join lateral ( select *
                                                                                       from entryurl fe
                                                                                       where fe.entrycode = e.entrycode
                                                                                         and public) as full_entry_urls on true
                                                                   left join lateral ( select filledoldestdate
                                                                                       from issue i
                                                                                       where i.issuecode = e.issuecode) as entry_issue on true
                                                          where e.storyversioncode = sv.storyversioncode
                                 ) as entries on true
                             where sv.storycode = entry_storyversion.storycode) as story_versions on true






-- where issuecode = 'nl/PO3 245'



select entrycode, issuecode, original_entry_urls
from entry_with_images

select *
from issue_with_images
where issuecode = 'nl/PO3 219'

select oldestdate, filledoldestdate
from issue
where oldestdate like '%Q%';

select count(issuecode)
from issue


create index issue_filledoldestdate on issue (filledoldestdate);
create index issue_oldestdate on issue (oldestdate);
create index entryurl_public on entryurl (public);

