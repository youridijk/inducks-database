import * as fs from "fs";
import * as path from "path";

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import {createTablesJSON} from "./TableJSON";
import {formatISVFiles} from "./ISV";
import {mapping} from "./QueryBuilders/Mapping";

yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command('format', 'Format all the ISV files into CSV that PostgreSQL can read', (yargs) => {
        return yargs
            .demandOption('isvdir', '--isvdir The path to the directory containing all ISV files from Inducks')
    }, async (argv) => {
        try {
            const isvdir = String(argv.isvdir);
            const resolvedISVDir = path.resolve(isvdir);
            if (!fs.existsSync(resolvedISVDir)) {
                throw Error(`Path doesn't exist: ${resolvedISVDir}`);
            }

            await formatISVFiles(resolvedISVDir);
        } catch (e) {
            console.log(e.message)
        }
    })
    .command('parse', 'Parse original createtables.sql file into a JSON file containing all data about the tables', (yargs) => {
        return yargs
            .demandOption('input', '--input The path to the createtables.sql file')
            .demandOption('output', '--output The output path for the generated table JSON file');
    }, (argv) => {
        const input = String(argv.input);
        const output = String(argv.output);
        try {
            const resolvedSqlFilePath = path.resolve(input);
            if (!fs.existsSync(resolvedSqlFilePath)) {
                throw Error(`Path doesn't exist: ${resolvedSqlFilePath}`);
            }
            createTablesJSON(resolvedSqlFilePath, output);
            console.log('Created ', output);
        } catch (e) {
            console.log(e.message);
        }
    })
    .command('generate', 'Generate a SQL file to create and fill all the Inducks tables with foreign keys', (yargs) => {
        return yargs
            .demandOption('input', '--input The tables JSON file containing all info about the tables. Needs to be in the format of the file generated using --parse')
            .demandOption('isvdir', '--isvdir The directory containing all the formatted ISV files (the CSV files from --format). Doesn\'t need to exist, so can be used in Docker')
            .demandOption('output', '--output The filename of the generated SQL file.')
            .demandOption('script', '--script The type of SQL script you want to generate.');
    }, (argv) => {
        const input = String(argv.input);
        const isvDir = String(argv.isvdir);
        const output = String(argv.output);
        const script = String(argv.script);
        try {
            const resolvedTablesJSONFile = path.resolve(input);
            if (!fs.existsSync(resolvedTablesJSONFile)) {
                throw Error(`Path doesn't exist: ${resolvedTablesJSONFile}`);
            }

            const queryBuilderObject = mapping[script];

            if (!queryBuilderObject) {
                throw Error(`Script must be one of the following: '${Object.keys(mapping).join(', ')}', not: ${script}`);
            }

            const queryBuilder = new queryBuilderObject.psql(resolvedTablesJSONFile, isvDir);
            queryBuilder.save(output);
            console.log('Created ', output);
        } catch (e) {
            console.log(e.message);
        }
    })
    .option('isvdir', {
        describe: 'The directory the ISV files are located',
        type: 'string',
    })
    .option('input', {
        describe: 'The path or filename for the input file',
        type: 'string',
        alias: 'i'
    })
    .option('output', {
        describe: 'The path or filename for the generated file',
        type: 'string',
        alias: 'o'
    })
    .option('script', {
        describe: 'The type of SQL script you want to generate',
        type: 'string',
        alias: 's'
    })
    // A todo for later
    // .option('sql-lang', {
    //     describe: 'The SQL language you want to generate the SQL into',
    //     type: 'string',
    // })
    .help('h')
    .alias('h', 'help')
    .parse()
