 curl "http://localhost:3000/meilisearch_character" \
 -o data/characters.json;

 cd data || exit;
 curl \
  -X POST 'http://localhost:7700/indexes/characters/documents' \
  -H 'Content-Type: application/json' \
  --data-binary @characters.json

cd ..
