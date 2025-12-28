import streamlit as st
import google.generativeai as genai
import requests

# מפתחות
GEMINI_KEY = "AIzaSyD2M5RYnucTUtWD5_H1upYWq-Rd8kwf1zM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

# הגדרת המודל - גרסה יציבה
genai.configure(api_key=GEMINI_KEY)

st.title("🏠 Base44 AI Engine")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    return requests.put(url, headers=headers, json={"additional_services": text, "status": "מנותח"})

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("נתח עכשיו"):
    with st.spinner("מנתח..."):
        try:
            # שימוש בשם המודל ללא תוספות
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            response = model.generate_content([
                "Analyze this blueprint. Create a Hebrew table of electrical and plumbing items.",
                {"mime_type": "application/pdf", "data": uploaded_file.getvalue()}
            ])
            
            st.markdown(response.text)
            
            if project_id:
                update_base44(project_id, response.text)
                st.success("הנתונים עודכנו ב-Base44!")
        except Exception as e:
            st.error(f"שגיאה: {e}")
