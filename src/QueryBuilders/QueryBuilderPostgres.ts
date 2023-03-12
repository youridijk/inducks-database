import TableData from "../model/TableData";
import ForeignKey from "../model/ForeignKey";
import QueryBuilder from "./QueryBuilder";
import Step from "../model/Step";

export default class QueryBuilderPostgres extends QueryBuilder {
    public CSVPathSettingName = 'csv.base_path';

    public getCreateStatement(tableData: TableData): string {
        const {tableName} = tableData;
        const joinedPKs = tableData.primaryKeys.join(', ');
        const columns = tableData.columns.map(c => `\t${c.name} ${c.type}`).join(',\n');

        const primaryKeysQuery = `\tPRIMARY KEY (${joinedPKs})`;

        return `-- SQL for re-creating and filling table ${tableName}\n` +
            `CREATE TABLE ${this.getSchemaName()}.${tableName}_temp` +
            '(\n' +
            columns + ',\n' +
            primaryKeysQuery + '\n' +
            ');\n'
    }

    public getDropStatement(tableData: TableData): string {
        const {tableName} = tableData;
        return `DROP TABLE IF EXISTS ${this.getSchemaName()}.${tableName}_old CASCADE;` + '\n' +
            `DROP TABLE IF EXISTS ${this.getSchemaName()}.${tableName}_temp CASCADE;` + '\n' +
            `DROP TABLE IF EXISTS ${this.getSchemaName()}.${tableName}_csv CASCADE;`
    }

    public getCSVPath(tableData: TableData): string {
        // return `current_setting('${this.CSVPathSettingName}') || '/' ||  '${tableName}'`;
        return `${this.CSVDirPath}/${tableData.fileName.replace('.isv', '.csv')}`
    }

    public getCreateCSVTempTableStatement(tableData: TableData): string {
        const {tableName} = tableData;
        return `CREATE TABLE ${this.getSchemaName()}.${tableName}_csv  ` +
            'AS\n' +
            'SELECT * \n' +
            `FROM ${this.getSchemaName()}.${tableName}_temp\n` +
            'WITH NO DATA;\n';
    }

    public getCopyCSVIntoCSVTempTableStatement(tableData: TableData): string {
        const fullISVPath = this.getCSVPath(tableData);
        return `COPY ${this.getSchemaName()}.${tableData.tableName}_csv FROM '${fullISVPath}' WITH (FORMAT CSV, NULL '', HEADER );`
    }

    public getInsertCSVIntoTempTableStatement(tableData: TableData): string {
        const {tableName} = tableData;
        const csvTableName = tableName + '_csv';
        const joinedPKs = tableData.primaryKeys.join(', ');
        const csvWhereClausePKs = tableData.primaryKeys.map(pk => `${pk} IS NOT NULL`).join(' AND ');

        return `INSERT INTO ${this.getSchemaName()}.${tableName}_temp` + '\n' +
            `SELECT DISTINCT ON (${joinedPKs}) *\n` +
            `FROM ${this.getSchemaName()}.${csvTableName}\n` +
            `WHERE ${csvWhereClausePKs};\n`;
    }

    public getRenameCurrentToOldStatement(tableName: string): string {
        return `ALTER TABLE IF EXISTS ${this.getSchemaName()}.${tableName} RENAME TO ${tableName}_old;`
    }

    public getRenameTempToNormalStatement(tableName: string): string {
        return `ALTER TABLE ${this.getSchemaName()}.${tableName}_temp RENAME TO ${tableName};`;
    }

    public tableHasForeignKeys(tableData: TableData): boolean {
        let foreignKeys = tableData.foreignKeys;

        if (!foreignKeys?.length) {
            return false;
        }

        return !!foreignKeys.filter(fk => !fk.skipCreation).length;
    }

    public getForeignKeyTables(tableJSON: TableData[]): TableData[] {
        return tableJSON.filter(function (tableData) {
            let foreignKeys = tableData.foreignKeys;

            if (!foreignKeys?.length) {
                return false;
            }

            return !!foreignKeys.filter(fk => !fk.skipCreation).length;
        });
    }

    public getForeignKeyIndexCreateStatements(tableData: TableData): string[] {
        return tableData.foreignKeys.map(function (foreignKey: ForeignKey) {
            const indexName = `fk_index_${tableData.tableName}_${foreignKey.column}`;
            return `CREATE INDEX ${indexName} ON ${this.getSchemaName()}.${tableData.tableName}_temp (${foreignKey.column});`
        }.bind(this));
    }

    public getForeignKeyIndexDropStatements(tableData: TableData): string[] {
        return tableData.foreignKeys.map(function (foreignKey: ForeignKey) {
            const indexName = `fk_index_${tableData.tableName}_${foreignKey.column}`;
            return `DROP INDEX IF EXISTS ${indexName};`
        }.bind(this));
    }

    public getPrimaryKeyIndexCreateStatement(tableData: TableData): string {
        const indexName = `pk_index_${tableData.tableName}`;
        return `CREATE INDEX ${indexName} ON ${this.getSchemaName()}.${tableData.tableName}_temp (${tableData.primaryKeys.join(',')});`;
    }

    public getPrimaryKeyIndexDropStatement(tableData: TableData): string {
        const indexName = `pk_index_${tableData.tableName}`;
        return `DROP INDEX IF EXISTS ${indexName};`
    }

    public getForeignKeyStatement(tableData: TableData): string {
        const {tableName} = tableData;
        const schemeName = this.getSchemaName();
        const foreignKeysConstraints = tableData.foreignKeys
            .filter(fk => !fk.skipCreation)
            .map(function (fk: ForeignKey) {
                return `\tADD CONSTRAINT fk_${tableName}_${fk.column}_${fk.referenceColumn} FOREIGN KEY (${fk.column}) ` +
                    `REFERENCES ${schemeName}.${fk.referenceTable}_temp (${fk.referenceColumn}) ON DELETE CASCADE`;
            });

        return `ALTER TABLE ${this.getSchemaName()}.${tableName}_temp` + '\n' + ` ${foreignKeysConstraints.join(',\n')};`;
    }

    public getForeignKeysUpdateStatement(tableData: TableData): string {
        let totalQuery = '';

        for (const foreignKey of tableData.foreignKeys) {
            const currentTableName = `${this.getSchemaName()}.${tableData.tableName}_temp`;
            const foreignTableName = `${this.getSchemaName()}.${foreignKey.referenceTable}_temp`;
            // const whereClause = `WHERE ${foreignKey.column} NOT IN (SELECT DISTINCT ${foreignKey.referenceColumn} FROM ${foreignTableName});\n\n`;
            const whereClause = `WHERE ${foreignKey.column} IN (\n` +
                `\tSELECT t1.${foreignKey.column}\n` +
                `\tFROM ${currentTableName} t1\n` +
                `\t    LEFT JOIN ${foreignTableName} t2 on t1.${foreignKey.column} = t2.${foreignKey.referenceColumn}\n` +
                `\tWHERE t2.${foreignKey.referenceColumn} IS NULL` +
            ');\n';

            if (tableData.primaryKeys.includes(foreignKey.column)) {
                // language=SQL format=false
                totalQuery += `DELETE FROM ${currentTableName}\n${whereClause}`

            } else {
                totalQuery += `UPDATE ${currentTableName}\n` +
                    `SET ${foreignKey.column} = NULL\n${whereClause}`;
            }
        }

        return totalQuery;
    }

    public getSchemaName(): string {
        return 'inducks';
    }

    public getAdditionalQueriesStart(): string {
        return `set session csv.base_path = '${this.CSVDirPath}';` + '\n' +
            `CREATE SCHEMA IF NOT EXISTS ${this.getSchemaName()};`
    }

    public getAdditionalQueriesEnd(): string {
        return `UPDATE ${this.getSchemaName()}.storyversion_temp` + '\n' +
            'SET storycode = null\n' +
            `WHERE storyversioncode in` + '\n' +
            '      (SELECT sv.storyversioncode\n' +
            `       FROM ${this.getSchemaName()}.storyversion_temp sv` + '\n' +
            `                LEFT JOIN ${this.getSchemaName()}.story_temp s ON s.storycode = sv.storycode` + '\n' +
            '       WHERE s.storycode IS NULL);\n' +
            `ALTER TABLE ${this.getSchemaName()}.storyversion_temp` + '\n' +
            'ADD CONSTRAINT fk_storyversion_storycode_storycode FOREIGN KEY (storycode) ' +
            `REFERENCES ${this.getSchemaName()}.story_temp (storycode) ON DELETE CASCADE;\n`;
    }

    public getFinalQuerySteps(tableJSON: TableData[]): Step[] {
        const dropStatements: string[] = [];
        const createStatements: string[] = [];
        // const primaryKeyIndexesCreateStatements: string[] = [];
        // const primaryKeyIndexesDropStatements: string[] = [];
        const createCSVTempTablesStatements: string[] = [];
        const copyCSVInTablesStatements: string[] = [];
        const insertCSVIntoTempTablesStatements: string[] = [];
        const renameToOldStatements: string[] = [];
        const renameToNormalStatements: string[] = [];

        // const tablesWithForeignKeys = this.getForeignKeyTables(tableJSON);
        // const foreignKeyStatements = tablesWithForeignKeys.map(this.getForeignKeyStatement.bind(this));
        const foreignKeyStatements: string[] = [];
        const foreignKeyIndexCreateStatements: string[] = [];
        const foreignKeyIndexDropStatements: string[] = [];
        const foreignKeyUpdateStatements: string[] = [];
        // tablesWithForeignKeys.map(function (tableData: TableData) {
        // return this.getForeignKeyIndexStatements(tableData).join('\n')
        // }.bind(this));

        for (const tableData of tableJSON) {
            dropStatements.push(this.getDropStatement(tableData));
            createStatements.push(this.getCreateStatement(tableData));
            // primaryKeyIndexesCreateStatements.push(this.getPrimaryKeyIndexCreateStatement(tableData));
            // primaryKeyIndexesDropStatements.push(this.getPrimaryKeyIndexDropStatement(tableData));
            createCSVTempTablesStatements.push(this.getCreateCSVTempTableStatement(tableData));
            copyCSVInTablesStatements.push(this.getCopyCSVIntoCSVTempTableStatement(tableData));
            insertCSVIntoTempTablesStatements.push(this.getInsertCSVIntoTempTableStatement(tableData));
            renameToOldStatements.push(this.getRenameCurrentToOldStatement(tableData.tableName));
            renameToNormalStatements.push(this.getRenameTempToNormalStatement(tableData.tableName));

            if (this.tableHasForeignKeys(tableData)) {
                foreignKeyStatements.push(this.getForeignKeyStatement(tableData));
                foreignKeyIndexCreateStatements.push(this.getForeignKeyIndexCreateStatements(tableData).join('\n'));
                foreignKeyIndexDropStatements.push(this.getForeignKeyIndexDropStatements(tableData).join('\n'));
                foreignKeyUpdateStatements.push(this.getForeignKeysUpdateStatement(tableData));
            }
        }

        return [
            {
                stepTitle: 'Set base path for CSV files',
                stepString: this.getAdditionalQueriesStart(),
            },
            {
                stepTitle: 'Delete old tables',
                stepString: dropStatements.join('\n'),
            },
            {
                stepTitle: 'Create tables',
                stepString: createStatements.join('\n'),
            },
            // {
            //     stepTitle: 'Drop primary keys indexes',
            //     stepString: primaryKeyIndexesDropStatements.join('\n'),
            // },
            // {
            //     stepTitle: 'Create primary keys indexes',
            //     stepString: primaryKeyIndexesCreateStatements.join('\n'),
            // },
            {
                stepTitle: 'Drop foreign keys indexes',
                stepString: foreignKeyIndexDropStatements.join('\n'),
            },
            {
                stepTitle: 'Create foreign keys indexes',
                stepString: foreignKeyIndexCreateStatements.join('\n'),
            },
            {
                stepTitle: 'Create CSV temp tables',
                stepString: createCSVTempTablesStatements.join('\n'),
            },
            {
                stepTitle: 'Copy CSV into CSV temp tables',
                stepString: copyCSVInTablesStatements.join('\n'),
            },
            {
                stepTitle: 'Insert CSV data into temp tables',
                stepString: insertCSVIntoTempTablesStatements.join('\n'),
            },
            {
                stepTitle: 'Set foreign keys that don\'t exists to null',
                stepString: foreignKeyUpdateStatements.join('\n'),
            },
            {
                stepTitle: 'Add foreign keys',
                stepString: foreignKeyStatements.join('\n'),
            },
            {
                stepTitle: 'Run additional queries for story version table',
                stepString: this.getAdditionalQueriesEnd(),
            },
            {
                stepTitle: 'Rename old tables to \'table\'_old',
                stepString: renameToOldStatements.join('\n'),
            },
            {
                stepTitle: 'Rename temp tables to normal table name',
                stepString: renameToNormalStatements.join('\n'),
            },
            {
                stepTitle: 'Delete all unused tables again',
                stepString: dropStatements.join('\n'),
            }
        ];
    }
}
