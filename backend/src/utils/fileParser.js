const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const path = require('path');

console.log('==== FILE PARSER WITH BUFFER SUPPORT - V2 ====');

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
            .pipe(csv({ headers: false })) // Sem headers - formato livre
            .on('data', (row) => {
                // Pegar primeira coluna como nome e demais como telefones
                const values = Object.values(row);
                
                if (values.length < 2) return; // Precisa de pelo menos nome + 1 telefone
                
                const nome = values[0] ? values[0].toString().trim() : '';
                
                // Coletar todos os telefones (colunas 1 em diante)
                const telefones = values.slice(1)
                    .map(tel => tel ? tel.toString().replace(/\D/g, '') : '')
                    .filter(tel => tel.length >= 10); // Apenas telefones válidos
                
                // Criar um contato para cada telefone
                telefones.forEach(telefone => {
                    if (nome && telefone) {
                        contacts.push({
                            nome: nome,
                            telefone: telefone
                        });
                    }
                });
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
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array mode

        const contacts = [];

        data.forEach(row => {
            if (!row || row.length < 2) return;
            
            const nome = row[0] ? row[0].toString().trim() : '';
            
            // Coletar telefones (índices 1 em diante)
            const telefones = row.slice(1)
                .map(tel => tel ? tel.toString().replace(/\D/g, '') : '')
                .filter(tel => tel.length >= 10);
            
            telefones.forEach(telefone => {
                if (nome && telefone) {
                    contacts.push({
                        nome: nome,
                        telefone: telefone
                    });
                }
            });
        });

        console.log('Excel parsed from buffer:', contacts.length, 'contacts');
        return contacts;

    } catch (error) {
        console.error('Excel parsing error:', error);
        throw error;
    }
}

module.exports = { parseContactsBuffer };