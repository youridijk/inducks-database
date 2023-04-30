#!/bin/zsh

FILE="/docker-entrypoint-initdb.d/4-create-auth-user.sql"
if ! [[ -z $POSTGRES_AUTH_USER || -z $POSTGRES_AUTH_PASSWORD ]]; then
  echo "CREATE ROLE \"$POSTGRES_AUTH_USER\";" > "$FILE"
  echo "ALTER ROLE \"$POSTGRES_AUTH_USER\" WITH password '$POSTGRES_AUTH_PASSWORD';" >> "$FILE"
  echo "GRANT web_anon TO \"$POSTGRES_AUTH_USER\";" >> "$FILE"
fi
