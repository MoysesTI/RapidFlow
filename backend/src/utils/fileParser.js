const xlsx = require('xlsx');
const fs = require('fs');

function parseCSV(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        throw new Error('Arquivo CSV vazio');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const contact = {};
        
        headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            
            if (header.includes('nome') || header.includes('name') || header.includes('aluno')) {
                contact.nome = value;
            } else if (header.includes('tel') || header.includes('phone') || header.includes('whats')) {
                contact.telefone = value;
            }
        });
        
        if (contact.nome && contact.telefone) {
            // Processar múltiplos telefones separados por /
            const phones = contact.telefone.split('/').map(p => p.trim()).filter(p => p);
            
            phones.forEach(phone => {
                contacts.push({
                    nome: contact.nome,
                    telefone: phone
                });
            });
        }
    }
    
    return contacts;
}

function parseXLSX(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const contacts = [];
    
    data.forEach(row => {
        let nome = '';
        let telefone = '';
        
        // Procurar colunas de nome
        Object.keys(row).forEach(key => {
            const keyLower = key.toLowerCase();
            if (keyLower.includes('nome') || keyLower.includes('name') || keyLower.includes('aluno')) {
                nome = row[key];
            } else if (keyLower.includes('tel') || keyLower.includes('phone') || keyLower.includes('whats')) {
                telefone = String(row[key]);
            }
        });
        
        if (nome && telefone) {
            // Processar múltiplos telefones separados por /
            const phones = telefone.split('/').map(p => p.trim()).filter(p => p);
            
            phones.forEach(phone => {
                contacts.push({
                    nome: nome,
                    telefone: phone
                });
            });
        }
    });
    
    return contacts;
}

function parseContactFile(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    
    if (ext === 'csv') {
        return parseCSV(filePath);
    } else if (ext === 'xlsx' || ext === 'xls') {
        return parseXLSX(filePath);
    } else {
        throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX');
    }
}

module.exports = { parseContactFile };
