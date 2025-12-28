import streamlit as st
import requests
import base64

# המפתח המשודרג שלך
GEMINI_KEY = "AIzaSyBUn_R3bqAU0Iz-Nwwrtp50zaI225IvLgM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - ניתוח כמויות סופי")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("בצע ניתוח"):
    with st.spinner("סורק תוכניות..."):
        pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
        
        # רשימת המודלים שזמינים לך אחרי השדרוג - לפי סדר עדיפות
        models_to_try = [
            "gemini-2.0-flash-exp", # הכי חדש (פלאש 2)
            "gemini-1.5-flash",     # היציב
            "gemini-1.5-flash-8b"   # המהיר לעקיפת עומס
        ]
        
        success = False
        prompt = """
        אתה מומחה לכתבי כמויות. נתח את ה-PDF.
        1. השב בעברית בלבד.
        2. בצע ספירה מדויקת של כל אביזר קצה (שקעים, מפסקים, נקודות מאור, נקודות מים).
        3. אל תכתוב "משוער" - כתוב מספרים סופיים לפי מה שמופיע בשרטוט.
        4. הצג שתי טבלאות: "חשמל ותקשורת" ו"אינסטלציה וגז".
        """

        for model_name in models_to_try:
            # הכתובת v1beta היא היחידה שתומכת ב-2.0 כרגע
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{"parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                ]}],
                "generationConfig": {"temperature": 0.0}
            }
            
            try:
                res = requests.post(api_url, json=payload)
                data = res.json()
                
                if 'candidates' in data:
                    ai_text = data['candidates'][0]['content']['parts'][0]['text']
                    st.success(f"בוצע בהצלחה (באמצעות {model_name})")
                    st.markdown(ai_text)
                    if project_id:
                        update_base44(project_id, ai_text)
                    success = True
                    break
            except:
                continue
        
        if not success:
            st.error("גוגל לא מאפשר גישה למודלים. ודאי שוב שה-API פעיל ב-Console.")
            st.json(data)
