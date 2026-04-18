# הדרכת התקנה – רובוט סינון תמונות WhatsApp

## מה זה עושה?
הרובוט מאזין לקבוצת WhatsApp (כגון "תמונות_גן"), ובכל פעם שמגיעה תמונה – הוא בודק אם אחד מהילדים שלך מופיע בה. אם כן, הוא מעביר אותה אוטומטית לקבוצה אחרת שתבחרי.

---

## שלב 1: שרת DigitalOcean (פעם אחת)

1. היכנסי לאתר [digitalocean.com](https://digitalocean.com) וצרי חשבון
2. לחצי **Create Droplet**:
   - Image: **Ubuntu 22.04**
   - Size: **Basic $6/month** (1GB RAM)
   - Region: **Frankfurt** (קרוב לישראל)
3. לחצי **Create Droplet** – תקבלי כתובת IP (לדוגמה: `165.22.80.123`)
4. התחברי לשרת:
   ```
   ssh root@165.22.80.123
   ```

---

## שלב 2: התקנה על השרת

הריצי את הפקודות הבאות אחת אחת:

```bash
# עדכון מערכת
apt update && apt upgrade -y

# התקנת Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# התקנת Python
apt install -y python3-pip python3-venv

# התקנת תלויות zיהוי פנים
apt install -y cmake build-essential libopenblas-dev liblapack-dev

# שכפול הפרויקט
git clone https://github.com/anat883/base44-ai-engine.git
cd base44-ai-engine
git checkout claude/whatsapp-photo-filter-bot-VFXwQ

# התקנת תלויות Node.js
cd bot && npm install && cd ..

# התקנת תלויות Python
cd face_service && pip3 install -r requirements.txt && cd ..

# הרשאות להרצה
chmod +x start.sh
```

---

## שלב 3: הגדרת שמות הקבוצות

ערכי את הקובץ `config.json`:

```json
{
  "source_group": "תמונות_גן",        ← שם הקבוצה שמקבלת תמונות מהגן
  "dest_group": "תמונות_הילדים_שלי",  ← שם הקבוצה שתקבל רק את הילדים שלך
  "tolerance": 0.5                    ← 0.4=קפדני מאוד / 0.6=מקל יותר
}
```

כדי לערוך:
```bash
nano config.json
```
(שמור עם Ctrl+X → Y → Enter)

---

## שלב 4: אימון הרובוט – ללמד אותו מי הילדים שלך

### אפשרות א' – דרך הדפדפן (קל יותר)

**על המחשב שלך (Windows):**

1. התקיני Python: הורידי מ-[python.org](https://python.org) → הורד → התקן
2. פתחי Command Prompt והריצי:
   ```
   pip install streamlit requests
   streamlit run train_ui.py
   ```
3. יפתח דפדפן → העלי 5-10 תמונות לכל ילד

**חשוב:** כדי שהממשק יתקשר עם השרת, הגדירי:
```
set FACE_SERVICE_URL=http://165.22.80.123:5000
streamlit run train_ui.py
```

### אפשרות ב' – ישירות על השרת (פשוט יותר)

צרי תיקיות ידנית על השרת:
```bash
mkdir -p faces/שם_ילד_1
# העתיקי תמונות דרך scp:
scp תמונה.jpg root@165.22.80.123:~/base44-ai-engine/faces/שם_ילד_1/
```

---

## שלב 5: הפעלת הרובוט

```bash
./start.sh
```

יופיע QR Code בטרמינל – פתחי WhatsApp בטלפון → שלוש נקודות → WhatsApp Web → סרקי את ה-QR.

**זהו! הרובוט פעיל.**

---

## שלב 6: הפעלה רציפה (כדי שירוץ גם כשמתנתקים)

```bash
# התקנת screen
apt install -y screen

# הפעלה ב-session מנותק
screen -S whatsapp-bot
./start.sh

# התנתקות בלי לסגור: Ctrl+A ואז D
# חזרה ל-session: screen -r whatsapp-bot
```

---

## פתרון בעיות

| בעיה | פתרון |
|------|--------|
| QR לא מופיע | `node bot.js` ישירות מתוך תיקיית `bot/` |
| "קבוצת יעד לא נמצאה" | ודאי שהשם ב-config.json זהה **בדיוק** לשם הקבוצה בוואטסאפ |
| הרובוט מפספס תמונות | שנני tolerance ל-0.6 ב-config.json |
| הרובוט מעביר תמונות לא נכונות | שנני tolerance ל-0.4 ב-config.json |
| שירות הזיהוי לא עולה | `cd face_service && python3 app.py` – ראי הודעות שגיאה |

---

## טיפים לתמונות טובות לאימון

- **5-10 תמונות** לכל ילד – יותר = טוב יותר
- תמונות עם **פנים קדמיות וברורות**
- **תאורה טובה** – לא חשוך, לא מוצף אור
- **זוויות שונות** – קדמי, צד, חצי פרופיל
- **גילאים שונים** אם יש תמונות ישנות
