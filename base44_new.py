import streamlit as st
import requests
import base64

# המפתח החדש והעובד שלך מה-AI Studio
GEMINI_KEY = "AIzaSyAAPlDNmchr51ktVwSMRXWIehFrG4n_szY"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח סופי")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי תוכנית PDF לניתוח", type="pdf")

if uploaded_file and st.button("התחל ניתוח"):
    with st.spinner("מנתח..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # ניסיון עם הכתובת הכי סטנדרטית שיש בגרסה v1
            api_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze the construction PDF. Return a Hebrew table of electrical and plumbing items and quantities."},
                        {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                    ]
                }]
            }
            
            response = requests.post(api_url, json=payload)
            result = response.json()
            
            if 'candidates' in result:
                ai_text = result['candidates'][0]['content']['parts'][0]['text']
                st.markdown(ai_text)
                
                if project_id:
                    update_base44(project_id, ai_text)
                    st.success("✅ ה-Dashboard עודכן!")
            else:
                # אם v1 נכשל, ננסה אוטומטית את v1beta עם השם המלא
                api_url_beta = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
                response = requests.post(api_url_beta, json=payload)
                result = response.json()
                
                if 'candidates' in result:
                    st.markdown(result['candidates'][0]['content']['parts'][0]['text'])
                else:
                    st.error("גוגל עדיין מחזיר שגיאת שם מודל. בואי נבדוק את הפלט:")
                    st.json(result)
                
        except Exception as e:
            st.error(f"שגיאה: {e}")
