import streamlit as st
import requests
import base64

# המפתח החדש שיצרת אחרי חיבור הבילינג
GEMINI_KEY = "AIzaSyBUn_R3bqAU0Iz-Nwwrtp50zaI225IvLgM" # ודאי שזה המפתח הכי חדש!
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח (Billing Active)")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("נתח עכשיו"):
    with st.spinner("מנתח מול שרת גוגל המאומת..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # שימוש בגרסת v1 היציבה - לעיתים קרובות פותר בעיות מכסה בחשבונות Billing
            api_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Analyze the blueprint. Create a Hebrew table of electrical and plumbing items and quantities."},
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
                    st.success("✅ הצלחה! הנתונים עודכנו.")
            else:
                st.error("שגיאת מכסה (Quota). גוגל עדיין לא פתח את המחסום.")
                st.json(result) # זה יראה לנו בדיוק מה הבעיה עכשיו
                
        except Exception as e:
            st.error(f"שגיאה: {e}")
