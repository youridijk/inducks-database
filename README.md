# Inducks database

A CLI to generate SQL scripts to create the Inducks database with foreign keys.
The original SQL script from Inducks is great and provides a good database structure, but it lacks foreign keys.
Adding foreign keys, opens the option to use PostgREST as a backend or the usage of any ORM.

## PostgREST

The SQL script generated by this CLI includes an anonymous role (the "web_anon" role")
that has read only access on the whole schema.
In addition, a role named "auth" is created that has only access to the Inducks schema.

### Run it locally

To run PostgREST locally, [install PostgREST](https://postgrest.org/en/stable/tutorials/tut0.html) and pass
the `inducks.conf` file in the `postgrest` folder as argument to the PostgREST executable.

### Run it locally using Docker

If you want to run PostgREST for the Inducks database using Docker, follow the instructions
on [the docs of PostgREST](https://postgrest.org/en/stable/install.html#docker)
or run it using the docker-compose.yaml in the root of this repository.

## Meilisearch

Meilisearch is used to search all the data of Inducks. By default, it serves a nice and simple dashboard to search the
data. Settings for each table that's searchable can be found in the `meilisearch/settings` directory.

### Current tables in Meilisearch

- Character
- Story partially

### Tables to be imported in Meilisearch

- Issue
- Publication
- Movie
- Person

## TODO

| What?                                                        | Status |
|--------------------------------------------------------------|--------|
| MySQL support                                                | ❌      |
| Add upsert SQL script generation to the CLI                  | ❌      |
| Postgres Docker image with all data                          | ❌      |
| Bash script to get Postgres database running in one step     | ❌      |
| Bash script to import all data and settings into Meilisearch | ❌      |
| Add more data to Meilisearch                                 | ❌      |

## NOTE

This project is not created by Inducks, but it uses the data from Inducks.
Big thanks to Inducks for creating a way to collect all this information.


