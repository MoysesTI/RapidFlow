const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

async function parseContactsFile(filePath) {
    console.log('Parsing file:', filePath);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist: ' + filePath);
    }

    const ext = path.extname(filePath).toLowerCase();
    console.log('File extension:', ext);

    if (ext === '.csv') {
        return parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
        return parseExcel(filePath);
    } else {
        throw new Error('Unsupported file type: ' + ext);
    }
}

function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const contacts = [];
        const stream = fs.createReadStream(filePath);

        stream
            .pipe(csv())
            .on('data', (row) => {
                const contact = normalizeContact(row);
                if (contact.telefone) {
                    contacts.push(contact);
                }
            })
            .on('end', () => {
                console.log('CSV parsing complete:', contacts.length, 'contacts');
                resolve(contacts);
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                reject(error);
            });
    });
}

function parseExcel(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const contacts = data
            .map(row => normalizeContact(row))
            .filter(contact => contact.telefone);

        console.log('Excel parsing complete:', contacts.length, 'contacts');
        return contacts;

    } catch (error) {
        console.error('Excel parsing error:', error);
        throw error;
    }
}

function normalizeContact(row) {
    // Tentar diferentes nomes de colunas
    const nome = row.nome || row.Nome || row.NOME || row.name || row.Name || row.NAME || '';
    const telefone = row.telefone || row.Telefone || row.TELEFONE || row.phone || row.Phone || row.PHONE || row.celular || row.Celular || '';

    // Limpar telefone (remover caracteres não numéricos)
    const telefoneLimpo = telefone.toString().replace(/\D/g, '');

    return {
        nome: nome.toString().trim(),
        telefone: telefoneLimpo,
        // Campos opcionais
        email: row.email || row.Email || row.EMAIL || '',
        cidade: row.cidade || row.Cidade || row.CIDADE || '',
        estado: row.estado || row.Estado || row.ESTADO || row.uf || row.UF || ''
    };
}

module.exports = { parseContactsFile };