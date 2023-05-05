# CLI build stage
FROM node:lts as cli
#ARG
# Install the CLI
WORKDIR /cli
COPY ./package*.json ./
RUN npm ci
COPY ./src ./src
COPY ./tsconfig.json ./
COPY ./tables.json ./
RUN npm run build

# Download the ISV files
RUN npm start -- download --isvfile all -o /
RUN npm start -- format --isvdir /isv -c
RUN rm -rf /isv/*.isv
RUN mkdir -p "/sql"

# Generate SQL script to create and fill the tables
RUN npm start -- generate --isvdir /isv -i ./tables.json -o /sql/1-createtables.sql -s createtables

FROM postgres:alpine as postgres

# Copy SQL file and ISV from previous container
COPY ./docker/postgres/docker-entrypoint-initdb.d/  /docker-entrypoint-initdb.d/
COPY ./sql/full-writer.sql  /docker-entrypoint-initdb.d/4-full-writer.sql
COPY --from=cli /sql/1-createtables.sql /docker-entrypoint-initdb.d/
COPY --from=cli /isv /isv
