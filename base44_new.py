import streamlit as st
import requests
import base64
import json
import pandas as pd

# ניסיון למשוך את המפתח מה-Secrets
gemini_key = st.secrets.get("AIzaSyD9fxrikrHObKv7U7bp9aWdQ1upFn_kvpw")

st.set_page_config(page_title="ADCO", layout="wide")
st.title("🏗️ ADCO")

# בדיקה אם המפתח קיים
if not gemini_key:
    st.error("⚠️ המפתח חסר! כנסי ל-Settings > Secrets ב-Streamlit והדביקי: GEMINI_KEY = 'YOUR_KEY'")
    st.stop()

# פונקציית עדכון ל-Base44
def update_base44(project_id, data_json):
    api_key_b44 = "925f8466c55c444093502ecdf3c480e9"
    app_id = "6831d8beaa3e6db4c335c40f"
    url = f"https://app.base44.com/api/apps/{app_id}/entities/Project/{project_id}"
    
    summary = "### אומדן כמויות AI:\n"
    for item in data_json.get('quantities', []):
        summary += f"- {item.get('canonical_item_name_he')}: {item.get('count')} {item.get('unit')}\n"
    
    payload = {
        "additional_services": summary,
        "status": "מנותח",
        "description": json.dumps(data_json, indent=2, ensure_ascii=False)
    }
    return requests.put(url, headers={'api_key': api_key_b44}, json=payload)

# ניהול תיקונים (למידה)
if 'corrections' not in st.session_state:
    st.session_state.corrections = []

with st.sidebar:
    st.header("🧠 זיכרון למידה")
    user_input = st.text_area("הערה לתיקון (למשל: 'העיגול הוא תאורה'):")
    if st.button("הוסף הנחיה"):
        st.session_state.corrections.append(user_input)
        st.rerun()
    if st.button("נקה זיכרון"):
        st.session_state.corrections = []
        st.rerun()

# העלאת קבצים
col1, col2 = st.columns(2)
with col1:
    plan_file = st.file_uploader("תוכנית PDF", type=["pdf", "png", "jpg"])
with col2:
    price_file = st.file_uploader("מחירון אקסל (אופציונלי)", type=["xlsx"])

if plan_file and st.button("הפעל ניתוח מלא"):
    with st.spinner("מנתח סמלים ומבצע הצלבות..."):
        try:
            base64_pdf = base64.b64encode(plan_file.read()).decode('utf-8')
            
            # בניית הפרומפט המקצועי
            corrections_str = "\n".join(st.session_state.corrections)
            prompt = f"""
            You are a professional Israeli construction estimator. 
            1. Scan the plan and count ALL electrical and plumbing symbols.
            2. Use BVD legend as baseline but also infer non-standard symbols from context.
            3. User specific instructions: {corrections_str}
            4. Return ONLY a JSON with keys: 'quantities' (list of objects) and 'flags' (list of risks/questions).
            5. Hebrew for item names.
            """

            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": plan_file.type, "data": base64_pdf}}]}],
                "generationConfig": {"temperature": 0.1, "response_mime_type": "application/json"}
            }
            
            res = requests.post(api_url, json=payload)
            raw_res = res.json()
            
            if 'candidates' in raw_res:
                clean_json = json.loads(raw_res['candidates'][0]['content']['parts'][0]['text'])
                st.subheader("📊 כמויות שזוהו")
                st.table(clean_json.get('quantities', []))
                
                project_id = st.query_params.get("project_id")
                if project_id:
                    update_base44(project_id, clean_json)
                    st.success("✅ עודכן ב-Base44")
            else:
                st.error("שגיאה בתגובת ה-AI")
                st.json(raw_res)
        except Exception as e:
            st.error(f"שגיאה: {e}")
