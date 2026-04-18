const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';

console.log(`מקשיב לקבוצה: "${config.source_group}"`);
console.log(`מעביר תמונות ל: "${config.dest_group}"`);

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        headless: true
    }
});

client.on('qr', (qr) => {
    console.log('\n============================');
    console.log('סרקו את ה-QR הזה עם הוואטסאפ שלכם:');
    console.log('============================\n');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('✅ אימות הצליח – session נשמר');
});

client.on('ready', () => {
    console.log('🟢 הבוט מחובר ופעיל!');
});

client.on('disconnected', (reason) => {
    console.log('🔴 הבוט התנתק:', reason);
    process.exit(1);
});

client.on('message', async (message) => {
    try {
        if (!message.hasMedia) return;

        const chat = await message.getChat();
        if (chat.name !== config.source_group) return;

        const media = await message.downloadMedia();
        if (!media || !media.mimetype.startsWith('image/')) return;

        console.log(`📸 תמונה חדשה מ-"${chat.name}" – בודק זיהוי פנים...`);

        const imageBuffer = Buffer.from(media.data, 'base64');
        const formData = new FormData();
        formData.append('image', imageBuffer, {
            filename: 'photo.jpg',
            contentType: media.mimetype
        });

        const response = await axios.post(`${FACE_SERVICE_URL}/check-photo`, formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });

        if (response.data.match) {
            const detectedChildren = response.data.children || [];
            console.log(`✅ זוהו: ${detectedChildren.join(', ')} – מעביר לקבוצת "${config.dest_group}"...`);

            const chats = await client.getChats();
            const destChat = chats.find(c => c.name === config.dest_group);

            if (destChat) {
                await destChat.sendMessage(media);
                console.log('✅ תמונה הועברה בהצלחה!');
            } else {
                console.error(`❌ קבוצת היעד "${config.dest_group}" לא נמצאה. בדקי את השם ב-config.json`);
            }
        } else {
            console.log('⏭️  לא זוהו ילדים – תמונה דולגת');
        }
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.error('❌ שירות זיהוי הפנים לא פעיל. הפעילי תחילה: python face_service/app.py');
        } else {
            console.error('שגיאה:', err.message);
        }
    }
});

client.initialize();
