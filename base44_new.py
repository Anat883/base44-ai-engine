import streamlit as st
import google.generativeai as genai
import requests

# המפתחות שלך (השארתי אותם בפנים כדי שזה יעבוד לך מיד)
GEMINI_KEY = "AIzaSyD2M5RYnucTUtWD5_H1upYWq-Rd8kwf1zM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

genai.configure(api_key=GEMINI_KEY)

st.set_page_config(page_title="Base44 AI Engine", layout="wide")
st.title("🏠 Base44 AI - מנוע ניתוח תוכניות")

# פונקציה לעדכון ה-Dashboard ב-Base44
def update_base44(project_id, data_text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {
        'api_key': BASE44_API_KEY,
        'Content-Type': 'application/json'
    }
    payload = {
        "additional_services": data_text,
        "status": "מנותח"
    }
    return requests.put(url, headers=headers, json=payload)

# קבלת מזהה הפרויקט מהכתובת (URL)
project_id = st.query_params.get("project_id", "")

if project_id:
    st.info(f"עובד על פרויקט מספר: {project_id}")
else:
    project_id = st.text_input("הכניסי Project ID (אופציונלי):")

uploaded_file = st.file_uploader("העלי תוכנית PDF לניתוח", type="pdf")

if uploaded_file and st.button("התחל ניתוח ועדכן Dashboard"):
    with st.spinner("ה-AI מנתח את התוכנית..."):
        try:
            model = genai.GenerativeModel('models/gemini-1.5-flash')
            prompt = "נתח את תוכנית ה-PDF: ספור פריטי חשמל ואינסטלציה. התעלם מריהוט. החזר טבלה בעברית."
            
            response = model.generate_content([
                prompt,
                {"mime_type": "application/pdf", "data": uploaded_file.getvalue()}
            ])
            
            st.markdown("### תוצאות הניתוח:")
            st.markdown(response.text)
            
            if project_id:
                res = update_base44(project_id, response.text)
                if res.status_code == 200:
                    st.success("✅ הנתונים עודכנו בהצלחה ב-Dashboard של Base44!")
                else:
                    st.error(f"הניתוח הצליח אך העדכון נכשל (קוד {res.status_code})")
                    
        except Exception as e:
            st.error(f"שגיאה: {e}")
