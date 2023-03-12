import path from "path";
import TableData from "../model/TableData";
import fs from "fs";
import Step from "../model/Step";

export default class QueryBuilder {
    constructor(
        public readonly tableJSONFilePath: string,
        public readonly CSVDirPath: string,
    ) {
        this.CSVDirPath = path.resolve(CSVDirPath);
        this.tableJSONFilePath = path.resolve(tableJSONFilePath);
    }

    public getFinalQuery(tableJSON: TableData[]): string {
        const steps = this.getFinalQuerySteps(tableJSON);
        const stepsStrings = steps.map(function (step, index) {
            return `-- Step ${index + 1} ${step.stepTitle}\n\n` + step.stepString;
        });

        return stepsStrings.join('\n\n');
    }

    public getFinalQueryWithPath(tableJSONPath: string): string {
        const tableJSONString = fs.readFileSync(tableJSONPath).toString();
        const tableJSON = JSON.parse(tableJSONString) as TableData[];
        return this.getFinalQuery(tableJSON);
    }

    public save(queriesOutputFilePath: string): void {
        const tableJSONString = fs.readFileSync(this.tableJSONFilePath).toString();
        const tableJSON = JSON.parse(tableJSONString) as TableData[]
        const queriesString = this.getFinalQuery(tableJSON);
        queriesOutputFilePath = path.resolve(queriesOutputFilePath);
        fs.writeFileSync(queriesOutputFilePath, queriesString);
    }

    public getFinalQuerySteps(tableJSON: TableData[]): Step[] {
        return [];
    }
}
