import streamlit as st
import requests
import base64
import json
import pandas as pd

# הגדרות מפתחות
GEMINI_KEY = "AIzaSyBUn_R3bqAU0Iz-Nwwrtp50zaI225IvLgM"
BASE44_API_KEY = "925f8466c55c444093502ecdf3c480e9"
APP_ID = "6831d8beaa3e6db4c335c40f"

st.set_page_config(page_title="Base44 AI - Learning Analyst", layout="wide")
st.title("🏗️ Base44 AI - ניתוח סמלים עם למידה ותיקון")

# אתחול זיכרון לתיקונים של המשתמשת
if 'user_corrections' not in st.session_state:
    st.session_state.user_corrections = []

def update_base44(project_id, data_json):
    url = f"https://app.base44.com/api/apps/{APP_ID}/entities/Project/{project_id}"
    headers = {'api_key': BASE44_API_KEY, 'Content-Type': 'application/json'}
    summary = "### אומדן סופי (לאחר תיקוני משתמש):\n"
    for item in data_json.get('quantities', []):
        summary += f"- {item['canonical_item_name_he']}: {item['count']} {item['unit']}\n"
    
    payload = {
        "additional_services": summary,
        "status": "מנותח",
        "description": json.dumps(data_json, indent=2, ensure_ascii=False)
    }
    return requests.put(url, headers=headers, json=payload)

# תפריט צד לניהול התיקונים
with st.sidebar:
    st.header("🧠 זיכרון למידה")
    if st.session_state.user_corrections:
        st.write("תיקונים פעילים:")
        for i, corr in enumerate(st.session_state.user_corrections):
            st.info(f"{i+1}. {corr}")
        if st.button("נקה זיכרון"):
            st.session_state.user_corrections = []
            st.rerun()
    else:
        st.write("אין תיקונים עדיין. ה-AI לומד מהערותייך.")

# ממשק ראשי
plan_file = st.file_uploader("העלי תוכנית PDF", type=["pdf", "png", "jpg"])
user_feedback = st.text_input("הערה ל-AI (למשל: 'הסמל שנראה כמו משולש הוא נקודת גז, לא מים')", placeholder="הזני תיקון כאן כדי לשפר את הדיוק")

if user_feedback and st.button("הוסף תיקון ונתח מחדש"):
    st.session_state.user_corrections.append(user_feedback)

if plan_file and st.button("הפעל ניתוח"):
    with st.spinner("סורק סמלים ומיישם תיקוני משתמש..."):
        try:
            plan_base64 = base64.b64encode(plan_file.read()).decode('utf-8')
            
            # בניית ההנחיה עם התיקונים
            corrections_text = "\n".join([f"- {c}" for c in st.session_state.user_corrections])
            
            prompt = f"""
            SYSTEM: You are a professional estimator. Scan the plan and count ALL symbols.
            
            USER CORRECTIONS TO REMEMBER:
            {corrections_text if corrections_text else "None yet. Use your own logic."}
            
            GOAL:
            1. Identify every graphical symbol.
            2. Even if not in BVD, infer meaning from context (Kitchen/Bath/Labels).
            3. If a symbol matches a user correction above, follow the correction strictly.
            
            OUTPUT: Strict JSON only with quantities and flags.
            """

            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"
            
            payload = {
                "contents": [{"parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": plan_file.type, "data": plan_base64}}
                ]}],
                "generationConfig": {"temperature": 0.1, "response_mime_type": "application/json"}
            }
            
            response = requests.post(api_url, json=payload)
            data = response.json()
            
            if 'candidates' in data:
                result = json.loads(data['candidates'][0]['content']['parts'][0]['text'])
                
                # הצגת התוצאות
                st.subheader("📊 תוצאות הניתוח")
                st.table(result.get('quantities', []))
                
                if result.get('flags'):
                    st.warning("⚠️ דגלים מהתוכנית:")
                    for f in result['flags'].get('questions_for_architect', []):
                        st.write(f"- {f}")
                
                project_id = st.query_params.get("project_id", "")
                if project_id:
                    update_base44(project_id, result)
                    st.success("✅ סונכרן ל-Base44")
            else:
                st.error("שגיאה בניתוח.")
                st.json(data)
                
        except Exception as e:
            st.error(f"שגיאה: {e}")
