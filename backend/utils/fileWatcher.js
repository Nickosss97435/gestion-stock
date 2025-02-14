const chokidar = require('chokidar');
const path = require('path');
const convertExcelToJson = require('./excelToJson');

function startFileWatcher() {
    const xlsxDir = path.join(__dirname, '../data/xlsx');

    const watcher = chokidar.watch(xlsxDir, {
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('change', (filePath) => {
        if (path.extname(filePath) === '.xlsx') {
            console.log(`Fichier mis à jour : ${filePath}`);
            convertExcelToJson(filePath);
        }
    });
    

    console.log(`Surveillance des fichiers dans : ${xlsxDir}`);
}

const { forceUpdateAll } = require('./excelToJson');

function startFileWatcher() {
    const xlsxDir = path.join(__dirname, '../data/xlsx');

    const watcher = chokidar.watch(xlsxDir, {
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('change', (filePath) => {
        if (path.extname(filePath) === '.xlsx') {
            console.log(`Fichier mis à jour : ${filePath}`);
            convertExcelToJson(filePath);
        }
    });

    console.log(`Surveillance des fichiers dans : ${xlsxDir}`);
}

module.exports = { startFileWatcher, forceUpdateAll };