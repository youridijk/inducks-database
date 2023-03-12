import QueryBuilder from "./QueryBuilder";
import CreateTablesPostgREST from "./createtables/CreateTablesPostgREST";
import UpsertDataPostgres from "./upsert/UpsertDataPostgres";

export const mapping: Record<string, Record<string, typeof QueryBuilder>> = {
    createtables: {
        psql: CreateTablesPostgREST
    },
    upsert: {
        psql: UpsertDataPostgres
    }
}
