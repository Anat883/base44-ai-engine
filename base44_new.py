import streamlit as st
import requests
import base64

# המפתח המשודרג שלך
GEMINI_KEY = "AIzaSyBUn_R3bqAU0Iz-Nwwrtp50zaI225IvLgM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI Engine - Professional BoQ", layout="wide")
st.title("🏠 Base44 AI - הפקת כתב כמויות מקצועי")

def update_base44(project_id, text):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    payload = {"additional_services": text, "status": "מנותח"}
    return requests.put(url, headers=headers, json=payload)

project_id = st.query_params.get("project_id", "")
uploaded_file = st.file_uploader("העלי תוכנית PDF לספירה וניתוח", type="pdf")

if uploaded_file and st.button("הפק כתב כמויות"):
    with st.spinner("מנתח סמלים ומחשב כמויות..."):
        try:
            pdf_base64 = base64.b64encode(uploaded_file.read()).decode('utf-8')
            
            # הגדרת ה-Prompt המקצועי
            prompt = """
            אתה מומחה להפקת כתב כמויות (BoQ) לבנייה ושיפוצים. 
            נתח את תוכנית ה-PDF המצורפת ובצע ספירה מדויקת של כל סמלי החשמל והאינסטלציה (לפי תקן ישראלי המופיע במדריך bvd).
            
            דרישות מחייבות:
            1. השב בעברית בלבד בפורמט טבלאי.
            2. ספור במדויק כל סמל: שקעים (רגיל/כוח/תלת פאזי), מפסקים, נקודות מאור, נקודות מים, דלוחין, ונקודות גז.
            3. חלק את התוצאה לפרקים הבאים בדיוק:
               - פירוק והריסה (זהה קירות להריסה בתוכנית)
               - בנייה וגבס (קירות חדשים)
               - אינסטלציה (נקודות מים ודלוחין)
               - חשמל + תאורה (שקעים, מפסקים, נקודות מאור)
               - ריצוף וחיפוי, טיח ושפכטל, צבע, מיזוג אויר, שונות.
            
            4. מבנה כל טבלה בתוך פרק:
               | תיאור | יחידה/קומפלט | כמות | מחיר יחידה | סה"כ מחיר | הערות קבלן |
            
            5. בסיום, הצג סיכום תקציבי:
               - סה"כ לא כולל מע"מ
               - מע"מ (18%)
               - סה"כ כולל מע"מ
            
            הנחיה חשובה: השאר את עמודת "מחיר יחידה" ריקה (או עם 0) כדי שהמשתמש יוכל למלא, אלא אם כן זיהית מחירים בתוכנית. אל תשתמש במילה "משוער", כתוב את המספר המדויק שספרת.
            """

            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{"parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "application/pdf", "data": pdf_base64}}
                ]}],
                "generationConfig": {"temperature": 0.1}
            }
            
            response = requests.post(api_url, json=payload)
            result = response.json()
            
            if 'candidates' in result:
                ai_text = result['candidates'][0]['content']['parts'][0]['text']
                st.markdown(ai_text)
                
                if project_id:
                    update_base44(project_id, ai_text)
                    st.success("✅ כתב הכמויות סונכרן ל-Base44")
            else:
                st.error("שגיאה בניתוח הקובץ.")
                st.json(result)
                
        except Exception as e:
            st.error(f"שגיאה טכנית: {e}")
