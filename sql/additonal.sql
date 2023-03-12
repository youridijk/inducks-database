-- Describes the job: i=indexing, t=translation, l=lettering, c=colouring
update inducks.issuejob
set inxtransletcol = CASE
                         WHEN (inxtransletcol = 'i') THEN 'indexing'
                         WHEN (inxtransletcol = 't') THEN 'translation'
                         WHEN (inxtransletcol = 'l') THEN 'lettering'
                         WHEN (inxtransletcol = 'c') THEN 'colouring'
END;

-- the number of tiers plus the average number of panels per tier (a letter from 'a' to 'l': a=1, b=2, etc.)
-- special layout, one of the following:
-- 'i' = illustration
-- 'c' = cover
-- 'f' = centerfold
-- 't' = text
-- 'a' = article
-- 'g' = game or puzzle
-- 's' = strange layout
-- 'L' = landscape painting
-- 'P' = portrait painting
-- '=' = printed sideways (only possible in DBI files)
-- '?' = uncertain
create index storyversion_kind on storyversion (kind);
create index storyversion_what on storyversion (what);
update inducks.storyversion
set kind = CASE
                         WHEN (kind = 'i') THEN 'illustration'
                         WHEN (kind = 'c') THEN 'cover'
                         WHEN (kind = 'f') THEN 'centerfold'
                         WHEN (kind = 'a') THEN 'article'
                         WHEN (kind = 'g') THEN 'game or puzzle'
                         WHEN (kind = 's') THEN 'strange layout'
                         WHEN (kind = 'L') THEN 'landscape painting'
                         WHEN (kind = 'P') THEN 'portrait painting'
                         WHEN (kind = '=') THEN 'printed sideways'
                         WHEN (kind = '?') THEN 'uncertain'
    END,
--     s = original story, c = changed, u = unidentified
    what = CASE
               WHEN (kind = 's') THEN 'original'
               WHEN (kind = 'c') THEN 'changed'
               WHEN (kind = 'u') THEN 'unidentified'
        END;

-- Describes the job: p=plot, w=writing, a=art(pencils), i=ink, r=reference
create index storyjob_plotwritartink on storyjob (plotwritartink);
update storyjob
set plotwritartink = CASE
              WHEN (plotwritartink = 'p') THEN 'plot'
              WHEN (plotwritartink = 'w') THEN 'writing'
              WHEN (plotwritartink = 'a') THEN 'art'
              WHEN (plotwritartink = 'i') THEN 'ink'
              WHEN (plotwritartink = 'r') THEN 'reference'
    END;

-- Describes the job: t=translation, l=lettering, c=colouring
create index entryjob_transletcol on entryjob (transletcol);
update entryjob
set transletcol = CASE
                         WHEN (transletcol = 't') THEN 'translation'
                         WHEN (transletcol = 'l') THEN 'lettering'
                         WHEN (transletcol = 'c') THEN 'colouring'
    END;
