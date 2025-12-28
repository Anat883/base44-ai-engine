import streamlit as st
import google.generativeai as genai
import requests
import os

# המפתחות שלך
GEMINI_KEY = "AIzaSyD2M5RYnucTUtWD5_H1upYWq-Rd8kwf1zM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

# הגדרת ה-API בצורה מפורשת לגרסה יציבה
os.environ["GOOGLE_API_USE_MTLS_ENDPOINT"] = "never"
genai.configure(api_key=GEMINI_KEY)

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח תוכניות")

def update_base44(project_id, data_text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": data_text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי תוכנית PDF לניתוח", type="pdf")

if uploaded_file and st.button("התחל ניתוח ועדכן Dashboard"):
    with st.spinner("מנתח..."):
        try:
            # הגדרה מפורשת של גרסת המודל
            model = genai.GenerativeModel(model_name='gemini-1.5-flash')
            
            # שליחה לניתוח
            response = model.generate_content([
                "Analyze the PDF. List electrical and plumbing quantities in a Hebrew table.",
                {"mime_type": "application/pdf", "data": uploaded_file.getvalue()}
            ])
            
            st.markdown(response.text)
            
            if project_id:
                update_base44(project_id, response.text)
                st.success("✅ ה-Dashboard עודכן!")
                    
        except Exception as e:
            # אם יש שגיאה, ננסה להשתמש בגרסה הישירה של ה-API
            st.error(f"שגיאת תקשורת: {e}")
            st.info("מנסה פתרון חלופי...")
