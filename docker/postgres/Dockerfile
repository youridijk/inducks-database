# CLI build stage
FROM node:lts as cli

# Install the CLI
WORKDIR /cli
COPY ./package*.json ./
RUN npm ci
COPY ./src ./src
#COPY ./sql /sql
COPY ./tsconfig.json ./
COPY ./tables.json ./
RUN npm run build

ENV CREATE_TABLES_FILE=/sql/1-createTablesPostgREST.sql

# Download the ISV files
RUN npm start -- download --isvfile all -o /
#COPY ./isv.tgz /
#RUN cd / && tar xf /isv.tgz
RUN npm start -- format --isvdir /isv -c
RUN rm -rf /isv/*.isv
RUN mkdir -p "/sql"

# Generate SQL script to create and fill the tables
RUN npm start -- generate --isvdir /isv -i ./tables.json -o "$CREATE_TABLES_FILE" -s createtables

# Combine the SQL files to prevent the full-writer.sql file being eecuted before create tables is finished
#RUN cat /sql/full-writer.sql >> $CREATE_TABLES_FILE

# Stage to create a dump of the database
# This way, final container doesn't contain ISV and is faster to boot
# Credits to https://cadu.dev/creating-a-docker-image-with-database-preloaded/
FROM postgres:alpine as dumper

# Copy SQL file and ISV from previous container
RUN mkdir -p "/docker-entrypoint-initdb.d/"
COPY --from=cli /sql/1-createTablesPostgREST.sql /docker-entrypoint-initdb.d/
COPY --from=cli /isv /isv
COPY ./sql/full-writer.sql  /docker-entrypoint-initdb.d/2-full-writer.sql

# Remove exec statement to prevent the postgres deamon from spawning
RUN ["sed", "-i", "s/exec \"$@\"/echo \"skipping...\"/", "/usr/local/bin/docker-entrypoint.sh"]

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV PGDATA=/data
ENV DUMP_FILE=/2-dump.sql

# Run entrypoint to create the database data
RUN ["/usr/local/bin/docker-entrypoint.sh", "postgres"]

# Start postgres in background, wait 5 seconds to boot it, make the dump and kill postgres
RUN su postgres -s $(which postgres) & sleep 5  &&  \
    pg_dump -U $POSTGRES_USER -W $POSTGRES_PASSWORD -h 127.0.0.1 $POSTGRES_DB > $DUMP_FILE \
RUN grep -v "OWNER" $DUMP_FILE > "$DUMP_FILE-2"
RUN mv "$DUMP_FILE-2" $DUMP_FILE

# Final build stage
FROM postgres:alpine

COPY --from=dumper /2-dump.sql /docker-entrypoint-initdb.d/
COPY ./docker/postgres/docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
