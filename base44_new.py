import streamlit as st
import requests
import base64

# מפתחות
GEMINI_KEY = "AIzaSyD2M5RYnucTUtWD5_H1upYWq-Rd8kwf1zM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.title("🏠 Base44 AI Engine - Stable")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    return requests.put(url, headers=headers, json={"additional_services": text, "status": "מנותח"})

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("נתח עכשיו"):
    with st.spinner("מנתח מול Google API v1..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # שינוי לגרסה v1 היציבה
            api_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze this blueprint. List electrical and plumbing quantities in a Hebrew table."},
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
                    st.success("עודכן ב-Base44!")
            else:
                st.error("שגיאה בתשובת ה-AI")
                st.json(result)
                
        except Exception as e:
            st.error(f"שגיאה: {e}")
