import ForeignKey from "./ForeignKey";
export default interface TableData {
    tableName: string;
    fileName: string;
    foreignKeys: ForeignKey[];
    columns: { name: string, type: string }[];
    primaryKeys: string[];
}
