curl "http://localhost:3000/story_view?select=id,storycode,originalstoryversioncode,creationdate,firstpublicationdate,title,storycomment,storyparts,issuecodeofstoryitem,originalstoryversion:fk_story_originalstoryversioncode_storyversioncode(what,kind,keywordsummary,storydescription(desctext),entry(title))" \
-o stories.json
