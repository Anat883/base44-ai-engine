import streamlit as st
import requests
import base64

# המפתח שעובד (D2M5)
GEMINI_KEY = "AIzaSyAAPlDNmchr51ktVwSMRXWIehFrG4n_szY"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - Final Fix")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("נתח עכשיו"):
    with st.spinner("מנסה להתחבר לגוגל..."):
        pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
        
        # רשימת השמות שגוגל משתמשת בהם כרגע
        models_to_try = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002"
        ]
        
        success = False
        for model in models_to_try:
            api_url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze the blueprint and return a Hebrew table of quantities."},
                        {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                    ]
                }]
            }
            
            try:
                res = requests.post(api_url, json=payload)
                data = res.json()
                
                if 'candidates' in data:
                    ai_text = data['candidates'][0]['content']['parts'][0]['text']
                    st.success(f"הצלחנו עם מודל: {model}!")
                    st.markdown(ai_text)
                    if project_id:
                        update_base44(project_id, ai_text)
                    success = True
                    break
            except:
                continue
        
        if not success:
            st.error("גוגל חוסם את כל השמות. נסי שוב בעוד דקה או בדקי את המכסה ב-AI Studio.")
            st.json(data) # מציג את השגיאה האחרונה לניתוח
