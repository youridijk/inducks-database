export default interface ForeignKey {
    column: string;
    referenceTable: string;
    referenceColumn: string;
    ignoreDuringImport?: boolean;
    skipCreation?: boolean;
}
