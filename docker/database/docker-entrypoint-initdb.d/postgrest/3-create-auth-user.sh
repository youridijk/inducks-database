#!/bin/zsh

FILE="/docker-entrypoint-initdb.d/4-create-auth-user.sql"
if ! [[ -z $AUTH_USER || -z $AUTH_PASSWORD ]]; then
  echo "CREATE ROLE \"$AUTH_USER\";" > "$FILE"
  echo "ALTER ROLE \"$AUTH_USER\" WITH password '$POSTGRES_AUTH_PASSWORD';" >> "$FILE"
  echo "GRANT web_anon TO \"$AUTH_USER\";" >> "$FILE"
fi
