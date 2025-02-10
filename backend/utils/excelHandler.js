const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'Stock');

// Lire le fichier Excel
const readExcel = () => {
  const workbook = xlsx.readFile(filePath);
  return workbook.Sheets[workbook.SheetNames[0]];
};

// Écrire dans le fichier Excel
const writeExcel = (data) => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, {societe}, {depot}, 'Stock');
  xlsx.writeFile(workbook, filePath);
};

module.exports = { readExcel, writeExcel };