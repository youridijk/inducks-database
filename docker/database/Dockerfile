ARG DATABASE_IMAGE=postgres:alpine
ARG DATABASE_TARGET=postgres

# CLI build stage
FROM node:alpine as cli
ARG DATABASE_TARGET

WORKDIR /
RUN apk add curl
# Download the ISV files
RUN curl 'https://inducks.org/inducks/isv.tgz' -o isv.tgz
RUN tar xf /isv.tgz

# Install the CLI
WORKDIR /cli
COPY ./package*.json ./
RUN npm ci
COPY ./src ./src
COPY ./tsconfig.json ./
COPY ./tables.json ./
RUN npm run build

RUN npm start -- format --isvdir /isv -c
RUN rm -rf /isv/*.isv
RUN mkdir -p "/sql"
RUN echo ${DATABASE_TARGET}
# Generate SQL script to create and fill the tables
RUN npm start -- generate --isvdir /isv -i ./tables.json -o /sql/1-createtables.sql -s createTables --database $DATABASE_TARGET

# Create the final database image using a speicified base image
FROM ${DATABASE_IMAGE} as database
ARG DATABASE_TARGET
# Copy SQL file and ISV from previous container
COPY ./docker/database/docker-entrypoint-initdb.d/$DATABASE_TARGET  /docker-entrypoint-initdb.d/
COPY ./sql/full-writer.sql  /docker-entrypoint-initdb.d/2-full-writer.sql
COPY --from=cli /sql/1-createtables.sql /docker-entrypoint-initdb.d/
COPY --from=cli /isv /isv
#RUN chmod +x /docker-entrypoint-initdb.d/*.sh
