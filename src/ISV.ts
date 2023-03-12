import * as fs from "fs";
import {open} from "fs/promises";
import firstline from 'firstline';

export async function formatISVFiles(isvFolder: string) {
    const files = fs.readdirSync(isvFolder);
    for (const file of files) {
        if (!file.endsWith('.isv')) {
            continue;
        }
        await formatISVFile(isvFolder + '/' + file);
        console.log('File ' + file + ' done');
    }
}

async function formatISVFile(isvFile: string) {
    const tempFileName = isvFile.replace('.isv', '.csv');
    const isvFirstLine = await firstline(isvFile);

    const columnCount = isvFirstLine.split('^').length - 1;

    if (fs.existsSync(tempFileName)) {
        fs.unlinkSync(tempFileName);
    }

    const file = await open(isvFile);
    const newFile = fs.createWriteStream(tempFileName, {
        flags: 'a', // 'a' means appending (old data will be preserved),
        autoClose: false
    });

    // Reading line by line to not use a lot of memory,
    // So this script is able to run on low memory devices like Raspberry Pi
    for await (let line of file.readLines()) {
        line = line.slice(0, -1);
        const lineParts = line
            .split('^')
            .map(function (linePart) {
                return linePart === '' ? '' : `"${linePart.replaceAll('"', '""')}"`;
            })
        line = lineParts.join(',');

        if (lineParts.length < columnCount) {
            for (let i = lineParts.length; i < columnCount; i++) {
                line += ',""';
            }
        }

        newFile.write(line + '\n');
    }

    newFile.close();
}
