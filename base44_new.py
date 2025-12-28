import streamlit as st
import requests
import base64

# המפתח העובד שלך
GEMINI_KEY = "AIzaSyAAPlDNmchr51ktVwSMRXWIehFrG4n_szY"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("נתח עכשיו"):
    with st.spinner("מנתח עם Gemini 2.0..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # זו הכתובת המדויקת למודל 2.0 פלאש בגרסה שמאפשרת שימוש חופשי
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze the construction blueprint. Return a Hebrew table of electrical and plumbing quantities. Ignore furniture."},
                        {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                    ]
                }]
            }
            
            response = requests.post(api_url, json=payload)
            result = response.json()
            
            # אם 2.0 עדיין עושה בעיות מכסה, נעבור אוטומטית ל-1.5
            if 'error' in result and result['error']['code'] == 429:
                st.info("מודל 2.0 עמוס, עובר ל-1.5...")
                api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
                response = requests.post(api_url, json=payload)
                result = response.json()

            if 'candidates' in result:
                ai_text = result['candidates'][0]['content']['parts'][0]['text']
                st.markdown(ai_text)
                if project_id:
                    update_base44(project_id, ai_text)
                    st.success("✅ עודכן ב-Base44!")
            else:
                st.error("שגיאה סופית מגוגל:")
                st.json(result)
                
        except Exception as e:
            st.error(f"שגיאה: {e}")
