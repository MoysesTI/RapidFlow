const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const path = require('path');

console.log('==== FILE PARSER WITH BUFFER SUPPORT ====');

async function parseContactsBuffer(buffer, filename) {
    console.log('Parsing buffer, filename:', filename);
    console.log('Buffer size:', buffer.length);

    const ext = path.extname(filename).toLowerCase();
    console.log('Extension:', ext);

    if (ext === '.csv') {
        return parseCSVBuffer(buffer);
    } else if (ext === '.xlsx' || ext === '.xls') {
        return parseExcelBuffer(buffer);
    } else {
        throw new Error('Unsupported file type: ' + ext);
    }
}

function parseCSVBuffer(buffer) {
    return new Promise((resolve, reject) => {
        const contacts = [];
        const stream = Readable.from(buffer.toString('utf-8'));

        stream
            .pipe(csv())
            .on('data', (row) => {
                const contact = {
                    nome: row.nome || row.Nome || row.name || row.Name || '',
                    telefone: (row.telefone || row.Telefone || row.phone || row.Phone || '').toString().replace(/\D/g, '')
                };

                if (contact.telefone) {
                    contacts.push(contact);
                }
            })
            .on('end', () => {
                console.log('CSV parsed from buffer:', contacts.length, 'contacts');
                resolve(contacts);
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                reject(error);
            });
    });
}

function parseExcelBuffer(buffer) {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const contacts = data
            .map(row => ({
                nome: row.nome || row.Nome || row.name || row.Name || '',
                telefone: (row.telefone || row.Telefone || row.phone || row.Phone || '').toString().replace(/\D/g, '')
            }))
            .filter(c => c.telefone);

        console.log('Excel parsed from buffer:', contacts.length, 'contacts');
        return contacts;

    } catch (error) {
        console.error('Excel parsing error:', error);
        throw error;
    }
}

module.exports = { parseContactsBuffer };