const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const db = require('./db');

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '';
const MIN_PHOTOS = 5;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        headless: true
    }
});

client.on('qr', (qr) => {
    console.log('\n============================');
    console.log('סרקו את ה-QR הזה עם הוואטסאפ שלכם:');
    console.log('============================\n');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => console.log('✅ אימות הצליח – session נשמר'));
client.on('ready', () => console.log('🟢 הבוט מחובר ופעיל!'));
client.on('disconnected', (reason) => { console.log('🔴 הבוט התנתק:', reason); process.exit(1); });

client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        const senderPhone = contact.id.user;

        if (chat.isGroup) {
            await handleGroupMessage(message, chat);
        } else {
            await handleDM(message, chat, senderPhone);
        }
    } catch (err) {
        console.error('שגיאה:', err.message);
    }
});

async function handleGroupMessage(message, chat) {
    if (!message.hasMedia) return;

    // Skip destination groups created by the bot
    const destGroupIds = db.getAllDestGroupIds();
    if (destGroupIds.includes(chat.id._serialized)) return;

    const media = await message.downloadMedia();
    if (!media || !media.mimetype.startsWith('image/')) return;

    console.log(`📸 תמונה חדשה מקבוצה "${chat.name}" – בודק זיהוי פנים...`);

    const imageBuffer = Buffer.from(media.data, 'base64');
    const formData = new FormData();
    formData.append('image', imageBuffer, { filename: 'photo.jpg', contentType: media.mimetype });

    let response;
    try {
        response = await axios.post(`${FACE_SERVICE_URL}/check-photo`, formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });
    } catch (err) {
        console.error(err.code === 'ECONNREFUSED'
            ? '❌ שירות זיהוי הפנים לא פעיל'
            : `שגיאת API: ${err.message}`);
        return;
    }

    const matchedPhones = response.data.matched_parents || [];
    if (matchedPhones.length === 0) {
        console.log('⏭️  לא זוהו ילדים – תמונה דולגת');
        return;
    }

    console.log(`✅ זוהו הורים: ${matchedPhones.join(', ')}`);
    const chats = await client.getChats();

    for (const phone of matchedPhones) {
        const parent = db.getParent(phone);
        if (!parent?.dest_group_id) continue;
        const destChat = chats.find(c => c.id._serialized === parent.dest_group_id);
        if (destChat) {
            await destChat.sendMessage(media);
            console.log(`📤 שלחתי לקבוצה של הורה ${phone}`);
        }
    }
}

async function handleDM(message, chat, senderPhone) {
    const text = (message.body || '').trim();
    const parent = db.getParent(senderPhone);

    // Admin commands
    if (ADMIN_PHONE && senderPhone === ADMIN_PHONE && text.startsWith('!')) {
        await handleAdmin(text, chat);
        return;
    }

    // Already active – nothing to do on text messages
    if (parent?.state === 'active' && !message.hasMedia) {
        await chat.sendMessage('✅ הרישום שלך פעיל! תמונות של ילדך מגיעות אוטומטית לקבוצה שלך 📸');
        return;
    }

    // Registration trigger
    if (!parent && (text === 'הירשם' || text.toLowerCase() === 'register')) {
        db.upsertParent(senderPhone, { state: 'pending_photos', photos_count: 0 });
        await chat.sendMessage(
            '👋 שלום! אני אסנן תמונות גן עבור ילדך אוטומטית.\n\n' +
            `שלח/י לי עכשיו *${MIN_PHOTOS}-10 תמונות* של ילדך (פנים ברורות, תמונה אחת בכל שליחה).\n` +
            `לאחר ${MIN_PHOTOS} תמונות אפעיל את הסינון ואצור לך קבוצה אישית.`
        );
        return;
    }

    // Collecting training photos
    if (parent?.state === 'pending_photos' && message.hasMedia) {
        const media = await message.downloadMedia();
        if (!media || !media.mimetype.startsWith('image/')) return;

        const imageBuffer = Buffer.from(media.data, 'base64');
        const formData = new FormData();
        formData.append('image', imageBuffer, { filename: 'photo.jpg', contentType: media.mimetype });
        formData.append('phone', senderPhone);

        try {
            await axios.post(`${FACE_SERVICE_URL}/parent/add-photo`, formData, {
                headers: formData.getHeaders(),
                timeout: 15000
            });
        } catch (err) {
            await chat.sendMessage('❌ שגיאה בשמירת התמונה. נסה/י שוב.');
            return;
        }

        db.incrementPhotos(senderPhone);
        const count = db.getParent(senderPhone).photos_count;

        if (count < MIN_PHOTOS) {
            await chat.sendMessage(`📷 קיבלתי ${count}/${MIN_PHOTOS} תמונות. שלח/י עוד!`);
            return;
        }

        // Enough photos – train and activate
        await chat.sendMessage('⏳ מאמן את הזיהוי... זה יקח כמה שניות.');

        try {
            await axios.post(`${FACE_SERVICE_URL}/parent/train`, { phone: senderPhone }, { timeout: 60000 });
        } catch (err) {
            await chat.sendMessage('❌ שגיאה באימון. נסה/י לשלוח עוד תמונות.');
            return;
        }

        // Create personal group for this parent
        try {
            const participantId = `${senderPhone}@c.us`;
            const groupResult = await client.createGroup('📸 תמונות ילדים שלי', [participantId]);
            const groupId = groupResult.gid._serialized;
            db.setGroupId(senderPhone, groupId);

            const chats = await client.getChats();
            const newGroup = chats.find(c => c.id._serialized === groupId);
            if (newGroup) {
                await newGroup.sendMessage('👋 ברוכים הבאים! כאן תקבלו תמונות שזיהוי הפנים מצא עם ילדכם. 🎉');
            }
            await chat.sendMessage('✅ הכל מוכן! קבוצה אישית נוצרה עבורך. תמונות עם ילדך יגיעו אוטומטית.');
        } catch (err) {
            console.error('שגיאה ביצירת קבוצה:', err.message);
            await chat.sendMessage('⚠️ לא הצלחתי ליצור קבוצה אוטומטית. פנה/י למנהל/ת.');
        }
        return;
    }

    // Unknown / no parent yet
    if (!parent) {
        await chat.sendMessage('שלח/י *הירשם* כדי להתחיל לקבל תמונות מסוננות של ילדך 📸');
    }
}

async function handleAdmin(text, chat) {
    if (text === '!stats') {
        const active = db.getAllActive();
        await chat.sendMessage(`📊 סטטוס:\n• הורים פעילים: ${active.length}`);
    } else if (text === '!help') {
        await chat.sendMessage('פקודות מנהל:\n!stats – נתונים\n!help – עזרה');
    }
}

client.initialize();
