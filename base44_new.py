import streamlit as st
import requests
import base64

# המפתח החדש שיצרת אחרי השדרוג (ודאי שזה המפתח מ-new1)
GEMINI_KEY = "AIzaSyBUn_R3bqAU0Iz-Nwwrtp50zaI225IvLgM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine - Ready", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח פעיל")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי תוכנית PDF לניתוח", type="pdf")

if uploaded_file and st.button("הפעל ניתוח AI"):
    with st.spinner("המערכת מנתחת את הקובץ..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # משתמשים ב-v1beta ובדגם 2.0 פלאש כפי שמופיע בלוח הבקרה שלך
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze the construction plan. Create a detailed Hebrew table with items and quantities for electricity and plumbing."},
                        {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                    ]
                }]
            }
            
            response = requests.post(api_url, json=payload)
            result = response.json()
            
            if 'candidates' in result:
                ai_text = result['candidates'][0]['content']['parts'][0]['text']
                st.markdown("### ניתוח כמויות:")
                st.markdown(ai_text)
                
                if project_id:
                    update_base44(project_id, ai_text)
                    st.success("✅ המידע נשלח בהצלחה ל-Base44!")
            else:
                # אם יש שגיאה, ננסה אוטומטית את מודל 1.5 פלאש כגיבוי
                st.info("מנסה נתיב חלופי...")
                api_url_fallback = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
                response = requests.post(api_url_fallback, json=payload)
                result = response.json()
                
                if 'candidates' in result:
                    st.markdown(result['candidates'][0]['content']['parts'][0]['text'])
                else:
                    st.error("שגיאה סופית מגוגל. בדקי את ה-JSON למטה:")
                    st.json(result)
                
        except Exception as e:
            st.error(f"שגיאה: {e}")
