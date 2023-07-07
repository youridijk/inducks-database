import CreateTablesPostgres from "./CreateTablesPostgres";
import TableData from "../../model/TableData";
import Step from "../../model/Step";

export default class CreateTablesPostgREST extends CreateTablesPostgres {
    public getAnomRoleName(): string {
        return 'web_anon';
    }

    public getAdditionalQueriesStartPostgREST(): string {
        // create anom role with read only rights
        return 'CREATE OR REPLACE FUNCTION inducks.create_role_if_not_exists(rolename NAME) RETURNS TEXT AS\n' +
            '$$\n' +
            'BEGIN\n' +
            '    IF NOT EXISTS (SELECT * FROM pg_roles WHERE rolname = rolename) THEN\n' +
            '        EXECUTE format(\'CREATE ROLE %I\', rolename);\n' +
            '        RETURN \'CREATE ROLE\';\n' +
            '    ELSE\n' +
            '        RETURN format(\'ROLE \'\'%I\'\' ALREADY EXISTS\', rolename);\n' +
            '    END IF;\n' +
            'END;\n' +
            '$$\n' +
            'LANGUAGE plpgsql;\n\n' +
            'SELECT * \n' +
            `FROM ${this.getSchemaName()}.create_role_if_not_exists('${this.getAnomRoleName()}');\n` +
            `ALTER ROLE ${this.getAnomRoleName()} NOLOGIN;\n` +
            `GRANT USAGE ON SCHEMA ${this.getSchemaName()} TO ${this.getAnomRoleName()};\n`;
    }

    public getGrantSelectOnTableStatement(tableData: TableData): string {
        return `GRANT SELECT ON ${this.getSchemaName()}.${tableData.tableName} TO ${this.getAnomRoleName()};`
    }

    public getCreateMD5Indexes(tableData: TableData[]): string {
        return tableData.map(table => {
            const joinedPrimaryKeys = table.primaryKeys.join(', ')
            return `CREATE INDEX md5_${table.tableName} ON ${table.tableName}(${joinedPrimaryKeys});`;
        }).join('\n')
    }

    getFinalQuerySteps(tableJSON: TableData[]): Step[] {
        const postgresSteps = super.getFinalQuerySteps(tableJSON);
        const additionalSteps: Step[] = [
            {
                stepTitle: 'Additional postgREST queries',
                stepString: this.getAdditionalQueriesStartPostgREST(),
            },
            {
                stepTitle: 'Grant usage on tables',
                stepString: tableJSON.map(this.getGrantSelectOnTableStatement.bind(this)).join('\n'),
            },
            {
                stepTitle: 'Create MD5 indexes on all primary keys',
                stepString: this.getCreateMD5Indexes(tableJSON),
            }
        ];

        postgresSteps.push(...additionalSteps)

        return postgresSteps;
    }
}
