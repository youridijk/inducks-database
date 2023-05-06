import QueryBuilder from "./QueryBuilder";
import CreateTablesPostgREST from "./createtables/CreateTablesPostgREST";
import UpsertDataPostgres from "./upsert/UpsertDataPostgres";
import CreateTablesPostgres from "./createtables/CreateTablesPostgres";
import CreateTablesMySQL from "./createtables/CreateTablesMySQL";

export const mapping: Record<string, Record<string, typeof QueryBuilder>> = {
    postgres: {
        createTables: CreateTablesPostgres,
        upsertData: UpsertDataPostgres,
    },
    postgrest: {
        createTables: CreateTablesPostgREST,
        upsertData: UpsertDataPostgres,
    },
    mysql: {
        createTables: CreateTablesMySQL
    }
}
