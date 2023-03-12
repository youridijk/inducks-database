import * as fs from 'fs';
import TableData from './model/TableData';

const createTablesSQLRegex = /(?<=# Step 2)([\s\S]*)(?=# Step 3)/;
const tableNamesRegex = /CREATE TABLE IF NOT EXISTS (.*?) LIKE/gm;
const createStatementsRegex = /^(# SQL for re-creating and filling table inducks.*)/gm;
const columnsRegex = /\(([\s\S]*)\) /;
const foreignKeysRegex = /KEY fk\d \((.*)\)/;
const primaryKeysRegex = /KEY pk0 \((.*)\)/;
const nonUsedTableNames = ['log', 'logdata', 'inputfile', 'induckspriv_story', 'induckspriv_issue', 'induckspriv_entry'];

export function createTablesJSON(createTablesSQLFilePath: string, tablesJSONOutputFilePath: string) {
    const createTablesFile = fs.readFileSync(createTablesSQLFilePath).toString();
    // get all create statements and get and filter table names
    const createTablesSQL = createTablesSQLRegex.exec(createTablesFile)[0];
    const tableNames = [...createTablesFile.matchAll(tableNamesRegex)]
        .map(r => r[1]);

    const tableShortNames = tableNames
        .map(n => n.replace('inducks_', ''))
        .filter(name => !nonUsedTableNames.includes(name));

    const createStatements = createTablesSQL
        .split(createStatementsRegex)
        .filter(s => !s.startsWith('#') && s !== '\n\n');

    const tableData = [];

    // console.log(tableShortNames)
    for (let statement of createStatements) {
        if (statement.includes('induckspriv')) {
            continue;
        }

        statement = statement.replaceAll('enum(\'Y\',\'N\')', 'bool')
        const [fileName, tableName] = /inducks_([a-z]*)/.exec(statement);
        // const fileName = /inducks_([a-z]*)/.exec(statement)[0];
        // console.log(fileName)

        if (nonUsedTableNames.includes(tableName)) {
            continue;
        }

        const currentTableData: TableData = {
            tableName,
            fileName: fileName + '.isv',
            foreignKeys: [],
            columns: [],
            primaryKeys: []
        };

        const columnsString = columnsRegex.exec(statement)[1]
        const columns = columnsString.split('\n');
        columns.pop();
        columns.shift();

        const primaryKeysString = primaryKeysRegex.exec(columnsString);
        if (primaryKeysString) {
            currentTableData.primaryKeys = primaryKeysString[1].split(', ');
        }

        const foreignKeysString = foreignKeysRegex.exec(columnsString);
        let foreignKeysColumns: string[] = []

        if (foreignKeysString) {
            // Parse all fk's (e.g. 'KEY fk0 (issuerangecode) KEY fk1 (publicationcode)' -> get only column name )
            foreignKeysColumns = foreignKeysString[1].split(', ');
            for (const foreignKeyColumn of foreignKeysColumns) {
                // Try auto find field in other table
                if (foreignKeyColumn.includes('code')) {
                    const tableName = foreignKeyColumn.replace('code', '');
                    if (tableShortNames.includes(tableName)) {
                        currentTableData.foreignKeys.push({
                            column: foreignKeyColumn,
                            referenceTable: tableName,
                            referenceColumn: foreignKeyColumn,
                        });
                        continue;
                    }
                }

                currentTableData.foreignKeys.push({
                    column: foreignKeyColumn,
                    referenceTable: null,
                    referenceColumn: null
                });
            }
        }

        for (const column of columns) {
            // Skip fk and pk as we already parsed it
            if (!column.includes('KEY')) {
                const columParts = column.split(' ');
                let type = columParts[5].replace(',', '');
                const columnName = columParts[4];

                // Replace mysql int(xxx) type with int
                if (/int\(\d\)/.test(type)) {
                    type = 'int';
                }

                currentTableData.columns.push({
                    name: columnName,
                    type: type
                });

                // if includes code, it might be fk
                if (columnName.includes('code')) {

                    const tableName = columnName.replace('code', '');
                    if (tableShortNames.includes(tableName) && tableName !== currentTableData.tableName &&
                        // !(currentTableData.primaryKeys.length === 1 && currentTableData.primaryKeys.includes(columnName)) &&
                        !foreignKeysColumns.includes(columnName)) {
                        // if (currentTableData.primaryKeys.length === 1 && currentTableData.primaryKeys.includes(columnName)) {
                        //     continue;
                        // }

                        currentTableData.foreignKeys.push({
                            column: columnName,
                            referenceTable: tableName,
                            referenceColumn: columnName,
                        });
                    }
                }
            }
        }

        tableData.push(currentTableData);
    }


    fs.writeFileSync(tablesJSONOutputFilePath, JSON.stringify(tableData, null, 2))
}
