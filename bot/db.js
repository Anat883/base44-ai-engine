const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'parents.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS parents (
    phone      TEXT PRIMARY KEY,
    dest_group_id TEXT,
    state      TEXT    DEFAULT 'pending_photos',
    photos_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const getParent = (phone) =>
    db.prepare('SELECT * FROM parents WHERE phone = ?').get(phone);

const upsertParent = (phone, fields) => {
    const existing = getParent(phone);
    if (existing) {
        const setClause = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
        db.prepare(`UPDATE parents SET ${setClause} WHERE phone = @phone`).run({ phone, ...fields });
    } else {
        const cols = ['phone', ...Object.keys(fields)].join(', ');
        const vals = ['@phone', ...Object.keys(fields).map(k => `@${k}`)].join(', ');
        db.prepare(`INSERT INTO parents (${cols}) VALUES (${vals})`).run({ phone, ...fields });
    }
};

const incrementPhotos = (phone) =>
    db.prepare('UPDATE parents SET photos_count = photos_count + 1 WHERE phone = ?').run(phone);

const setGroupId = (phone, groupId) =>
    db.prepare("UPDATE parents SET dest_group_id = ?, state = 'active' WHERE phone = ?").run(groupId, phone);

const getAllDestGroupIds = () =>
    db.prepare('SELECT dest_group_id FROM parents WHERE dest_group_id IS NOT NULL').all()
        .map(r => r.dest_group_id);

const getAllActive = () =>
    db.prepare("SELECT * FROM parents WHERE state = 'active'").all();

module.exports = { getParent, upsertParent, incrementPhotos, setGroupId, getAllDestGroupIds, getAllActive };
