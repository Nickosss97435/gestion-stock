const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

function convertExcelToJson(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    const headers = jsonData[0];
    const data = jsonData.slice(1).map(row => {
        return headers.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
        }, {});
    });

    const jsonFilePath = path.join(__dirname, '../data/json', path.basename(filePath, '.xlsx') + '.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
    console.log(`Fichier JSON créé : ${jsonFilePath}`);
}

// Nouvelle fonction pour forcer la mise à jour de tous les fichiers Excel
function forceUpdateAll() {
    const xlsxDir = path.join(__dirname, '../data/xlsx');
    const files = fs.readdirSync(xlsxDir);

    files.forEach(file => {
        if (path.extname(file) === '.xlsx') {
            const filePath = path.join(xlsxDir, file);
            console.log(`Forcer la mise à jour du fichier : ${filePath}`);
            convertExcelToJson(filePath);
        }
    });
}

module.exports = { convertExcelToJson, forceUpdateAll };
