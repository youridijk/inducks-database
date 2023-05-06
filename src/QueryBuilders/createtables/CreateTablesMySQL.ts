import CreateTablesPostgres from "./CreateTablesPostgres";
import TableData from "../../model/TableData";
import ForeignKey from "../../model/ForeignKey";

export default class CreateTablesMySQL extends CreateTablesPostgres {

    getForeignKeyIndexDropStatements(tableData: TableData): string[] {
        return tableData.foreignKeys.map((foreignKey: ForeignKey) => {
            const indexName = `fk_index_${tableData.tableName}_${foreignKey.column}`;
            return `DROP INDEX ${this.getSchemaName()}.${indexName} ON ${tableData.tableName};`
        });
    }

    getCreateCSVTempTableStatement(tableData: TableData, fromTempTable: boolean = true): string {
        const {tableName} = tableData;
        return `CREATE TABLE IF NOT EXISTS ${this.getSchemaName()}.${tableName}_csv ` +
            `LIKE ${this.getSchemaName()}.${tableName}${fromTempTable ? '_temp' : ''};`

    }

    getCopyCSVIntoCSVTempTableStatement(tableData: TableData): string {
        const fullISVPath = this.getCSVPath(tableData);
        return `LOAD DATA LOCAL INFILE "${fullISVPath}"\n` +
            `INTO TABLE ${this.getSchemaName()}.${tableData.tableName}_csv FIELDS TERMINATED BY ',' IGNORE 1 LINES;`;
    }

    getInsertCSVIntoTempTableStatement(tableData: TableData, fromTempTable: boolean = true): string {
        const {tableName} = tableData;
        const csvTableName = tableName + '_csv';
        const joinedPKs = tableData.primaryKeys.join(', ');
        const csvWhereClausePKs = tableData.primaryKeys.map(pk => `${pk} IS NOT NULL`).join(' AND ');

        return `INSERT INTO ${this.getSchemaName()}.${tableName}${fromTempTable ? '_temp' : ''}` + '\n' +
            `SELECT *\n` +
            `FROM ${this.getSchemaName()}.${csvTableName}\n` +
            `WHERE ${csvWhereClausePKs}\n` +
            `GROUP BY (${joinedPKs});\n`;
    }

    getRenameCurrentToOldStatement(tableName: string): string {
        return `RENAME TABLE ${this.getSchemaName()}.${tableName} TO ${this.getSchemaName()}.${tableName}_old;`
    }

    getRenameTempToNormalStatement(tableName: string): string {
        return `RENAME TABLE ${this.getSchemaName()}.${tableName}_temp TO ${this.getSchemaName()}.${tableName};`;
    }
}
