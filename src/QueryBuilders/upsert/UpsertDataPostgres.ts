import CreateTablesPostgres from "../createtables/CreateTablesPostgres";
import Step from "../../model/Step";
import TableData from "../../model/TableData";

export default class UpsertDataPostgres extends CreateTablesPostgres {

    getUpsertDatStatement(tableData: TableData): string {
        let superResult = this.getInsertCSVIntoTempTableStatement(tableData, false);
        superResult = superResult.slice(0, -2); // Remove ';'

        superResult += `\nON CONFLICT (${tableData.primaryKeys.join(', ')})\n`;
        superResult += 'DO UPDATE SET\n';

        const columnUpdates = tableData.columns.map(column => `\t${column.name} = EXCLUDED.${column.name}`);
        superResult += columnUpdates.join(',\n');

        // const foreignKeysColums = tableData.foreignKeys.map(fk => fk.column);
        // superResult += `\nON CONFLICT (${foreignKeysColums.join(',')}) DO NOTHING`;

        return superResult + ';';
    }

    getFinalQuerySteps(tableJSON: TableData[]): Step[] {
        const dropCSVTablesStatements: string[] = [];
        const createCSVTempTablesStatements: string[] = [];
        const copyCSVInTablesStatements: string[] = [];
        const upsertDataInTableStatements: string[] = [];
        const foreignKeyUpdateStatements: string[] = [];

        for (const tableData of tableJSON) {
            dropCSVTablesStatements.push(this.getCSVTableDropStatements(tableData));
            createCSVTempTablesStatements.push(this.getCreateCSVTempTableStatement(tableData, false));
            copyCSVInTablesStatements.push(this.getCopyCSVIntoCSVTempTableStatement(tableData));
            upsertDataInTableStatements.push(this.getUpsertDatStatement(tableData));

            if (this.tableHasForeignKeys(tableData)) {
                foreignKeyUpdateStatements.push(this.getForeignKeysUpdateStatement(tableData));
            }
        }

        return [
            {
                stepTitle: 'Drop old CSV temp tables',
                stepString: dropCSVTablesStatements.join('\n'),
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
                stepTitle: 'Clean up tables',
                stepString: foreignKeyUpdateStatements.join('\n\n').replaceAll('_temp', '_csv'),
            },
            {
                stepTitle: 'Upsert data into the tables',
                stepString: upsertDataInTableStatements.join('\n\n'),
            },
            {
                stepTitle: 'Drop old CSV temp tables',
                stepString: dropCSVTablesStatements.join('\n'),
            },
        ]
    }
}
