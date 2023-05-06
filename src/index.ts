import * as fs from 'fs';
import * as path from 'path';
import decompress from 'decompress';

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'

import {createTablesJSON} from './TableJSON';
import {formatISVFiles} from './ISV';
import {mapping} from './QueryBuilders/Mapping';
import downloadWithProgress from './vendor/DownloadWithProgress';
import {allowedISVFiles, supportedDataBases, supportedScripts} from "./data/Constants";

yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command('format', 'Format all the ISV files into CSV that PostgreSQL can read', (yargs) => {
        return yargs
            .option('concurrent', {
                alias: 'c'
            })
            .demandOption('isvdir', '--isvdir The path to the directory containing all ISV files from Inducks')
    }, async (argv) => {
        try {
            const concurrent: boolean = argv.concurrent as  boolean;

            if (concurrent) {
                console.log('Using concurrent mode');
            }

            const isvDir = String(argv.isvdir);
            const resolvedISVDir = path.resolve(isvDir);
            if (!fs.existsSync(resolvedISVDir)) {
                throw Error(`Path doesn't exist: ${resolvedISVDir}`);
            }

            await formatISVFiles(resolvedISVDir, concurrent);
        } catch (e) {
            console.log(e.message);
            yargs.exit(1, e.message);
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
            yargs.exit(1, e.message);
        }
    })
    .command('generate', 'Generate a SQL file to create and fill all the Inducks tables with foreign keys', (yargs) => {
        return yargs
            .demandOption('input', '--input The tables JSON file containing all info about the tables. Needs to be in the format of the file generated using --parse')
            .demandOption('isvdir', '--isvdir The directory containing all the formatted ISV files (the CSV files from --format). Doesn\'t need to exist, so can be used in Docker')
            .demandOption('output', '--output The filename of the generated SQL file.')
            .demandOption('script', '--script The type of SQL script you want to generate. Must be one of the following: ' + supportedScripts.join(', '))
            .demandOption('database', '--database The target database used for the script generation. Must be one of ' + supportedDataBases.join(', '));
    }, (argv) => {
        const input = String(argv.input);
        const isvDir = String(argv.isvdir);
        const output = String(argv.output);
        const script = String(argv.script);
        const database = String(argv.database);

        try {
            if (!supportedDataBases.includes(database)) {
                throw Error(`Database not support: ${database}. Supported are ${supportedDataBases.join(', ')}`);
            }

            if (!supportedScripts.includes(script)) {
                throw Error(`Script not support: ${script}. Supported are ${supportedScripts.join(', ')}`);
            }

            const resolvedTablesJSONFile = path.resolve(input);
            if (!fs.existsSync(resolvedTablesJSONFile)) {
                throw Error(`Path doesn't exist: ${resolvedTablesJSONFile}`);
            }

            const queryBuilderObject = mapping[database][script];

            const queryBuilder = new queryBuilderObject(resolvedTablesJSONFile, isvDir);
            queryBuilder.save(output);
            console.log('Created ', output);
        } catch (e) {
            console.log(e.message);
            yargs.exit(1, e.message);
        }
    })
    .command('download', 'Download ISV files from Inducks', (yargs) => {
        return yargs
            .demandOption('isvfile')
            .demandOption('output', 'The directory where the ISV files will be stored after download')

    }, async (argv) => {
        let isvFile = String(argv.isvfile);
        const isvFileFull = 'inducks_' + isvFile;
        const output = String(argv.output);
        const downloadAll = isvFile === 'all';

        try {
            if (!allowedISVFiles.includes(isvFile) && !allowedISVFiles.includes(isvFileFull)) {
                throw new Error(`'${isvFile}' not allowed to download`)
            }

            if (!isvFile.startsWith('inducks_')) {
                isvFile = isvFileFull;
            }

            if (fs.existsSync(output)) {
                const fileStat = fs.statSync(output);
                if (!fileStat.isDirectory()) {
                    throw new Error('Output path is not a directory');
                }
            } else {
                fs.mkdirSync(output, {
                    recursive: true
                })
            }

            const url = 'https://inducks.org/inducks/' + (downloadAll ? 'isv.tgz' : 'isv/' + isvFile);

            if (downloadAll) {
                isvFile = 'isv.tgz';
            }

            const downloadPath = path.join(output, isvFile);
            await downloadWithProgress(url, downloadPath);

            if (downloadAll) {
                console.log(`Decompressing '${downloadPath}' to ${output}`);
                await decompress(downloadPath, output);

                if (fs.existsSync(downloadPath)) {
                    fs.unlinkSync(downloadPath);
                    console.log('Deleted ' + downloadPath);
                }
            }
        } catch (e) {
            console.log(e.message);
            yargs.exit(1, e.message);
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
        describe: 'The type of SQL script you want to generate. Must be one of the following: ' + supportedScripts.join(', '),
        type: 'string',
        alias: 's'
    })
    // A todo for later
    .option('database', {
        describe: '--database The target database used for the script generation. Must be one of ' + supportedDataBases.join(', '),
        type: 'string',
        short: 'd',
    })
    .option('isvfile', {
        describe: 'The ISV file you want to download. Use \'all\' to download all the files',
        type: 'string'
    })
    .option('concurrent', {
        description: 'Whether you want to format the files one by one or at the same time (concurrent)',
        type: 'boolean',
        short: 'c'
    })
    .help('h')
    .alias('h', 'help')
    .parse()
