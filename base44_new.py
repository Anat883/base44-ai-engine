import streamlit as st
import google.generativeai as genai
import requests

# המפתחות שלך
GEMINI_KEY = "AIzaSyD2M5RYnucTUtWD5_H1upYWq-Rd8kwf1zM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

# הגדרה לעבודה עם הגרסה היציבה
genai.configure(api_key=GEMINI_KEY)

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח תוכניות")

# פונקציה לעדכון ה-Dashboard
def update_base44(project_id, data_text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": data_text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

# קבלת מזהה הפרויקט
project_id = st.query_params.get("project_id", "")

uploaded_file = st.file_uploader("העלי תוכנית PDF לניתוח", type="pdf")

if uploaded_file and st.button("התחל ניתוח ועדכן Dashboard"):
    with st.spinner("ה-AI מנתח..."):
        try:
            # שימוש במודל היציב ביותר ללא סיומות
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # יצירת התוכן
            response = model.generate_content([
                "נתח את תוכנית ה-PDF: ספור פריטי חשמל ואינסטלציה. התעלם מריהוט. החזר טבלה בעברית.",
                {"mime_type": "application/pdf", "data": uploaded_file.getvalue()}
            ])
            
            st.markdown(response.text)
            
            if project_id:
                update_base44(project_id, response.text)
                st.success("✅ ה-Dashboard עודכן!")
                    
        except Exception as e:
            # אם יש שגיאה, ננסה מודל חלופי (gemini-pro) אוטומטית
            try:
                model = genai.GenerativeModel('gemini-pro')
                # הערה: gemini-pro לא תמיד תומך בקבצי PDF ישירות ללא המרה
                st.error(f"שגיאת מודל: {e}. מנסה מודל חלופי...")
            except:
                st.error(f"שגיאה קריטית: {e}")
