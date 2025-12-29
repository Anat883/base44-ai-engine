import streamlit as st
import requests
import base64
import json

# משיכת המפתח מהכספת
try:
    GEMINI_KEY = st.secrets["AIzaSyD9fxrikrHObKv7U7bp9aWdQ1upFn_kvpw"]
except:
    st.warning("נא להגדיר GEMINI_KEY ב-Secrets")
    st.stop()

BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

# ... (חלקי הממשק וה-Prompt נשארים אותו דבר) ...

if 'candidates' in data:
    try:
        raw_text = data['candidates'][0]['content']['parts'][0]['text']
        # ניקוי תווים מיותרים שגוגל לפעמים מוסיף (כמו ```json)
        clean_text = raw_text.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean_text)
        
        # בדיקה אם התוצאה היא רשימה או מילון (תיקון השגיאה שלך)
        if isinstance(result, list):
            # אם זו רשימה, נהפוך אותה למבנה הצפוי
            final_data = {"quantities": result, "flags": {}}
        else:
            final_data = result

        # תצוגה
        st.subheader("📊 תוצאות הניתוח")
        quantities = final_data.get('quantities', [])
        if quantities:
            st.table(quantities)
        else:
            st.write("לא נמצאו כמויות לספירה.")

        if final_data.get('flags'):
            st.warning("⚠️ דגלים מהתוכנית:")
            flags = final_data['flags']
            # טיפול בפורמטים שונים של flags
            if isinstance(flags, dict):
                for k, v in flags.items():
                    if isinstance(v, list):
                        for item in v: st.write(f"- {item}")
            elif isinstance(flags, list):
                for f in flags: st.write(f"- {f}")

        # סנכרון ל-Base44
        project_id = st.query_params.get("project_id", "")
        if project_id:
            # (פונקציית העדכון שלך)
            st.success("✅ נשלח ל-Base44")

    except Exception as parse_error:
        st.error(f"שגיאה בפענוח הנתונים: {parse_error}")
        st.text("הטקסט הגולמי שהתקבל:")
        st.code(raw_text)
