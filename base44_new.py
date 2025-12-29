import streamlit as st
import requests
import base64
import json
import pandas as pd
from io import BytesIO

# 1. משיכת המפתח מה-Secrets
try:
    gemini_key = st.secrets["GEMINI_KEY"]
except Exception:
    st.error("⚠️ המפתח (GEMINI_KEY) חסר ב-Secrets של Streamlit!")
    st.stop()

# 2. הגדרות עיצוב לימין לשמאל (RTL)
st.markdown("""
    <style>
    .main { direction: rtl; text-align: right; }
    div[data-testid="stBlock"] { direction: rtl; text-align: right; }
    div[data-testid="stMarkdownContainer"] { text-align: right; direction: rtl; }
    .stButton>button { width: 100%; border-radius: 5px; background-color: #f0f2f6; }
    table { direction: rtl; margin-left: auto; margin-right: 0; width: 100%; border-collapse: collapse; }
    th { text-align: right !important; background-color: #f0f2f6; padding: 10px; }
    td { text-align: right !important; padding: 10px; border-bottom: 1px solid #ddd; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏗️ ADCO - אומדן כמויות וניתוח תוכניות")

# 3. ניהול תיקונים (למידה) ב-Sidebar
if 'corrections' not in st.session_state:
    st.session_state.corrections = []

with st.sidebar:
    st.header("🧠 זיכרון למידה")
    user_input = st.text_area("הנחיה לתיקון (למשל: 'הריבוע עם ה-X הוא שקע כוח'):")
    if st.button("הוסף הנחיה"):
        if user_input:
            st.session_state.corrections.append(user_input)
            st.rerun()
    
    if st.session_state.corrections:
        st.write("---")
        for i, c in enumerate(st.session_state.corrections):
            st.info(f"{i+1}. {c}")
        if st.button("נקה זיכרון"):
            st.session_state.corrections = []
            st.rerun()

# 4. העלאת קבצים וניתוח
plan_file = st.file_uploader("העלי תוכנית PDF (חשמל או אינסטלציה)", type=["pdf", "png", "jpg", "jpeg"])

if plan_file:
    if st.button("הפעל ניתוח ADCO"):
        with st.spinner("מנתח סמלים ומכין כתב כמויות..."):
            try:
                base64_pdf = base64.b64encode(plan_file.read()).decode('utf-8')
                corrections_str = "\n".join(st.session_state.corrections)
                
                prompt = f"""
                אתה מומחה לאומדן בנייה בישראל. נתח את התוכנית והפק כתב כמויות בפורמט JSON.
                1. הפרדה מלאה: כל סוג סמל בשורה נפרדת.
                2. פרקים: סווג ל"חשמל ותקשורת" או "אינסטלציה וגז".
                3. מבנה: 'תיאור', 'מחלקה', 'יחידה', 'כמות', 'הערות'.
                4. למידה: השתמש בתיקונים: {corrections_str}
                5. החזר JSON נקי בלבד: {{"items": [...]}}
                """

                api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": plan_file.type, "data": base64_pdf}}]}],
                    "generationConfig": {"temperature": 0.1, "response_mime_type": "application/json"}
                }
                
                res = requests.post(api_url, json=payload)
                data = res.json()
                
                if 'candidates' in data:
                    result_json = json.loads(data['candidates'][0]['content']['parts'][0]['text'])
                    items = result_json.get('items', [])
                    
                    if items:
                        df = pd.DataFrame(items)
                        # תצוגה
                        for dept in ["חשמל ותקשורת", "אינסטלציה וגז"]:
                            if 'מחלקה' in df.columns:
                                subset = df[df['מחלקה'] == dept]
                                if not subset.empty:
                                    st.subheader(f"📋 פרק: {dept}")
                                    st.table(subset)
                        
                        # אקסל
                        output = BytesIO()
                        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                            df.to_excel(writer, index=False, sheet_name='ADCO_Estimate')
                        
                        st.download_button(
                            label="📥 הורד כתב כמויות לאקסל (Excel)",
                            data=output.getvalue(),
                            file_name=f"ADCO_Estimate_{plan_file.name}.xlsx",
                            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
                    else:
                        st.warning("לא זוהו סמלים.")
                else:
                    st.error("שגיאה בתגובת ה-AI.")

            except Exception as e:
                st.error(f"שגיאה: {e}")

# זיהוי פרויקט (אופציונלי)
project_id = st.query_params.get("project_id")
if project_id:
    st.caption(f"מזהה פרויקט פעיל: {project_id}")
