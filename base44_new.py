import streamlit as st
import requests
import base64

# המפתח החדש והמדויק שמצאת ב-AI Studio
GEMINI_KEY = "AIzaSyAAPlDNmchr51ktVwSMRXWIehFrG4n_szY"
# נתוני ה-Base44 שלך
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine 2.0", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח (גרסה 2.0)")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי תוכנית PDF לניתוח", type="pdf")

if uploaded_file and st.button("התחל ניתוח"):
    with st.spinner("ה-AI (גרסה 2.0) מנתח את התוכנית..."):
        try:
            # המרת הקובץ ל-Base64
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # הכתובת המדויקת של המודל החדש שמצאת
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze this construction blueprint. Create a clear Hebrew table listing electrical and plumbing quantities. Ignore furniture."},
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
                    st.success("✅ הנתונים נשלחו בהצלחה ל-Dashboard!")
            else:
                st.error("שגיאה בתשובת ה-AI")
                st.json(result) # נדפיס רק אם יש תקלה
                
        except Exception as e:
            st.error(f"שגיאה בתהליך: {e}")
