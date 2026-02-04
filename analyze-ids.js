import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappingPath = path.join(__dirname, 'lovemigration', 'user_id_mapping.json');
const cardsPath = path.join(__dirname, 'lovemigration', 'user-cards-query-results-export-2026-02-03_23-22-51.csv');

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const knownIds = new Set(mapping.success.map(u => u.oldId));

console.log(`Known Users: ${knownIds.size}`);
console.log('Known IDs:', [...knownIds]);

const cardsContent = fs.readFileSync(cardsPath, 'utf8');
const lines = cardsContent.trim().split('\n');
// Handle potential \r\n
const headers = lines[0].trim().split(';');
const userIdIndex = headers.indexOf('user_id');

console.log(`User ID Index in CSV: ${userIdIndex}`);

const cardUserIds = new Set();
const missingIds = new Set();

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    const uid = cols[userIdIndex];

    if (uid) {
        cardUserIds.add(uid);
        if (!knownIds.has(uid)) {
            missingIds.add(uid);
        }
    }
}

console.log(`\nTotal Card Rows: ${lines.length - 1}`);
console.log(`Unique Users in Cards: ${cardUserIds.size}`);
console.log(`Users Missing from Export: ${missingIds.size}`);
console.log(`Missing IDs:`, [...missingIds]);
