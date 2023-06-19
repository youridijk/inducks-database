curl "https://inducks.dijk.cc/api/postgrest/meilisearch_issue" -o data/issues.json

 curl \
  -X POST 'https://meilisearch.dijk.cc/indexes/issues/documents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer o9ulMpEPQH5ODLgSJMv7K-z8Si9jniwGlkDYHTGz4MY' \
  --data-binary @data/issues.json
#https://inducks.org/hr.php?image=https%3A%2F%2Foutducks.org%2Fwebusers%2Fwebusers%2F2014%2F04%2Fnl_po3_219a_001.jpg&normalsize=1

#https://outducks.org/webusers/webusers/2014/04/nl_po3_219a_001.jpg&normalsize=1
