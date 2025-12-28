import streamlit as st
import requests
import base64

# ודאי שזה המפתח שנוצר *אחרי* הודעת ה-Upgraded!
GEMINI_KEY = "AIzaSyBUn_R3bqAU0Iz-Nwwrtp50zaI225IvLgM" 
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine - Pro", layout="wide")
st.title("🏠 Base44 AI - ניתוח כמויות מדויק")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("בצע ניתוח סופי"):
    with st.spinner("סורק את התוכנית ברמת הסמל..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # שימוש בגרסה v1 היציבה עבור חשבונות משולמים
            api_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
            
            prompt = """
            אתה מומחה לכתבי כמויות לבנייה. נתח את ה-PDF המצורף.
            הוראות מחייבות:
            1. השב בעברית בלבד.
            2. אל תכתוב הערות פתיחה או סיום באנגלית.
            3. אל תכתוב "כמות משוערת". בצע ספירה מדויקת של כל אביזר קצה המופיע בתוכנית (שקעים, מפסקים, נקודות מאור, נקודות מים, כלים סניטריים).
            4. הצג שתי טבלאות נפרדות: "חשמל ותקשורת" ו"אינסטלציה וגז".
            5. עמודות הטבלה: | פריט | כמות | מיקום/הערה |
            6. התעלם מרהיטים, התמקד רק בנקודות תשתית.
            """
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.0 # מקסימום דיוק, מינימום ניחושים
                }
            }
            
            response = requests.post(api_url, json=payload)
            result = response.json()
            
            if 'candidates' in result:
                ai_text = result['candidates'][0]['content']['parts'][0]['text']
                st.markdown(ai_text)
                if project_id:
                    update_base44(project_id, ai_text)
                    st.success("✅ נשלח ל-Base44")
            else:
                # אם v1 עדיין נותן 404, ננסה אוטומטית v1beta עם המפתח המשודרג
                api_url_beta = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
                response = requests.post(api_url_beta, json=payload)
                result = response.json()
                if 'candidates' in result:
                    st.markdown(result['candidates'][0]['content']['parts'][0]['text'])
                else:
                    st.error("שגיאה סופית מגוגל:")
                    st.json(result)
                    
        except Exception as e:
            st.error(f"שגיאה: {e}")
