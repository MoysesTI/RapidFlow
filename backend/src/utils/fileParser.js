const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

console.log('==== FILE PARSER LOADED ====');

async function parseContactsFile(filePath) {
    console.log('Parsing file:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
        throw new Error('File not found: ' + filePath);
    }

    const ext = path.extname(filePath).toLowerCase();
    console.log('Extension:', ext);

    if (ext === '.csv') {
        return parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
        return parseExcel(filePath);
    } else {
        throw new Error('Invalid file type: ' + ext);
    }
}

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const contacts = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const contact = {
                    nome: row.nome || row.Nome || row.name || '',
                    telefone: (row.telefone || row.Telefone || row.phone || '').toString().replace(/\D/g, '')
                };
                
                if (contact.telefone) {
                    contacts.push(contact);
                }
            })
            .on('end', () => {
                console.log('CSV parsed:', contacts.length, 'contacts');
                resolve(contacts);
            })
            .on('error', reject);
    });
}

function parseExcel(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        const contacts = data
            .map(row => ({
                nome: row.nome || row.Nome || row.name || '',
                telefone: (row.telefone || row.Telefone || row.phone || '').toString().replace(/\D/g, '')
            }))
            .filter(c => c.telefone);

        console.log('Excel parsed:', contacts.length, 'contacts');
        return contacts;

    } catch (error) {
        console.error('Excel parse error:', error);
        throw error;
    }
}

module.exports = { parseContactsFile };