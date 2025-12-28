import streamlit as st
import requests
import base64

# המפתח שעובד בוודאות (השני שהוצאת)
GEMINI_KEY = "AIzaSyCoIyPC4x0CX1uXISf2lPEdGxD9IVedX4s"
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

if uploaded_file and st.button("נתח עכשיו"):
    with st.spinner("מנתח עם Gemini 2.0 Flash..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # זו הכתובת המדויקת מה-cURL שלך!
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze this construction blueprint. Create a Hebrew table of electrical and plumbing items. Focus only on technical quantities."},
                        {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.1 # הופך את ה-AI ליותר מדויק ופחות "יצירתי"
                }
            }
            
            response = requests.post(api_url, json=payload)
            result = response.json()
            
            if 'candidates' in result:
                ai_text = result['candidates'][0]['content']['parts'][0]['text']
                st.markdown(ai_text)
                if project_id:
                    update_base44(project_id, ai_text)
                    st.success("✅ הנתונים עודכנו ב-Base44!")
            else:
                # אם שוב יש 429, נציג הודעה ברורה
                if result.get('error', {}).get('code') == 429:
                    st.error("גוגל אומר שהמכסה היומית של המפתח הזה הסתיימה. נסי ליצור מפתח חדש ב-AI Studio.")
                else:
                    st.error("שגיאה בניתוח:")
                    st.json(result)
                
        except Exception as e:
            st.error(f"שגיאה טכנית: {e}")
