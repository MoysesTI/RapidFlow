const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const path = require('path');

console.log('==== FILE PARSER WITH BUFFER SUPPORT - V3 ====');

// Função para adicionar espaços em nomes CamelCase
function formatName(name) {
    if (!name) return '';
    
    // Remove espaços extras
    name = name.trim();
    
    // Se já tem espaços, retorna como está
    if (name.includes(' ')) return name;
    
    // Adiciona espaço antes de letras maiúsculas (CamelCase)
    // Ex: "MariaJulia" -> "Maria Julia"
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .trim();
}

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
            .pipe(csv({ headers: false }))
            .on('data', (row) => {
                const values = Object.values(row);
                
                if (values.length < 2) return;
                
                const nomeRaw = values[0] ? values[0].toString().trim() : '';
                const nome = formatName(nomeRaw);
                
                const telefones = values.slice(1)
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
            })
            .on('end', () => {
                console.log('CSV parsed from buffer:', contacts.length, 'contacts');
                if (contacts.length > 0) {
                    console.log('Sample:', contacts[0]);
                }
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
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const contacts = [];

        data.forEach(row => {
            if (!row || row.length < 2) return;
            
            const nomeRaw = row[0] ? row[0].toString().trim() : '';
            const nome = formatName(nomeRaw);
            
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
        if (contacts.length > 0) {
            console.log('Sample:', contacts[0]);
        }
        return contacts;

    } catch (error) {
        console.error('Excel parsing error:', error);
        throw error;
    }
}

module.exports = { parseContactsBuffer };