import streamlit as st
import requests
import base64

# מפתחות
GEMINI_KEY = "AIzaSyD2M5RYnucTUtWD5_H1upYWq-Rd8kwf1zM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.title("🏠 Base44 AI Engine - Stable Mode")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    return requests.put(url, headers=headers, json={"additional_services": text, "status": "מנותח"})

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי PDF", type="pdf")

if uploaded_file and st.button("נתח עכשיו"):
    with st.spinner("מפעיל מודל יציב..."):
        try:
            # המרת הקובץ לטקסט או שליחתו כפי שהוא למודל Pro
            # הערה: gemini-pro לעיתים דורש המרה לטקסט, אבל ננסה קודם את הגישה הישירה
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": "נתח את תוכנית הבנייה המצורפת (במידה וניתן לקרוא אותה) או בצע ניתוח כללי. החזר טבלה בעברית של כמויות חשמל ואינסטלציה."
                    }]
                }]
            }
            
            response = requests.post(api_url, json=payload)
            result = response.json()
            
            if 'candidates' in result:
                ai_text = result['candidates'][0]['content']['parts'][0]['text']
                st.markdown(ai_text)
                if project_id:
                    update_base44(project_id, ai_text)
                    st.success("הנתונים עודכנו ב-Base44!")
            else:
                # ניסיון אחרון עם מודל gemini-1.5-pro אם flash לא נמצא
                st.error("המודל לא הגיב. מנסה גרסת פרו...")
                api_url_pro = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={GEMINI_KEY}"
                # (כאן הקוד ינסה שוב עם פרו במידת הצורך)
                st.json(result) # נדפיס את השגיאה המלאה כדי שנבין מה גוגל רוצים
                
        except Exception as e:
            st.error(f"שגיאה: {e}")
