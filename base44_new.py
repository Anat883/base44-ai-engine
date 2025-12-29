import streamlit as st
import requests
import base64
import json
import pandas as pd
from io import BytesIO

# משיכת המפתח מה-Secrets - ודאי שהשם ב-Secrets הוא GEMINI_KEY
try:
    gemini_key = st.secrets["GEMINI_KEY"]
except:
    st.error("⚠️ המפתח (GEMINI_KEY) חסר ב-Secrets של Streamlit!")
    st.stop()

# הגדרות עיצוב לימין לשמאל (RTL)
st.markdown("""
    <style>
    .main { direction: rtl; text-align: right; }
    div[data-testid="stBlock"] { direction: rtl; text-align: right; }
    div[data-testid="stMarkdownContainer"] { text-align: right; direction: rtl; }
    .stButton>button { width: 100%; border-radius: 5px; background-color: #f0f2f6; }
    table { direction: rtl; margin-left: auto; margin-right: 0; width: 100%; }
    th { text-align: right !important; }
    td { text-align: right !important; }
    </style>
    """, unsafe_allow_html=True)

# כותרת המותג שלך
st.title("🏗️ ADCO - אומדן כמויות וניתוח תוכניות")

# ניהול תיקונים (למידה) ב-Sidebar
if 'corrections' not in st.session_state:
    st.session_state.corrections = []

with st.sidebar:
    st.header("🧠 זיכרון למידה")
    user_input = st.text_area("הנחיה לתיקון (למשל: 'הריבוע הוא שקע מוגן מים'):")
    if st.button("הוסף הנחיה"):
        if user_input:
            st.session_state.corrections.append(user_input)
            st.rerun()
    
    if st.session_state.corrections:
        st.write("---")
        for i, c in enumerate(st.session_state.corrections):
            st.info(f"{i+1}. {c}")
        if st.button("נקה זיכרון"):
            st.session_state.corrections = []
            st.rerun()

# העלאת קבצים
plan_file = st.file_uploader("העלי תוכנית PDF", type=["pdf", "png", "jpg"])

if plan_file and st.button("הפעל ניתוח"):
    with st.spinner("ADCO מנתחת את הסמלים בתוכנית..."):
        try:
            base64_pdf = base64.b64encode(plan_file.read()).decode('utf-8')
            corrections_str = "\n".join(st.session_state.corrections)
            
            prompt = f"""
            אתה מומחה לאומדן בנייה בישראל. נתח את התוכנית והפק כתב כמויות בפורמט JSON.
            
            דרישות מחייבות:
            1. הפרדה מלאה: כל סוג סמל בשורה נפרדת (אל תאחד שקעים מסוגים שונים).
            2. פרקים: חלק ל"חשמל ותקשורת" ו"אינסטלציה וגז".
            3. עמודות: 'תיאור', 'מחלקה', 'יחידה', 'כמות', 'הערות'.
            4. למידה מהערות משתמש: {corrections_str}
            5. החזר JSON נקי בלבד עם המפתח 'items'.
            """

            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": plan_file.type, "data": base64_pdf}}]}],
                "generationConfig": {"temperature": 0.1, "response_mime_type": "application/json"}
            }
            
            res = requests.post(api_url, json=payload)
            data = res.json()
            
            if 'candidates' in data:
                result_json = json.loads(data['candidates'][0]['content']['parts'][0]['text'])
                items = result_json.get('items', [])
                
                if items:
                    df = pd.DataFrame(items)
                    
                    # הצגת הטבלאות
                    for dept in ["חשמל ותקשורת", "אינסטלציה וגז"]:
                        subset = df
