import streamlit as st
import requests
import base64
import json
import pandas as pd
import time
import tempfile
import os
from io import BytesIO
import google.generativeai as genai

# 1. הגדרות וסודות
try:
    gemini_key = st.secrets["GEMINI_KEY"]
except Exception:
    st.error("⚠️ המפתח (GEMINI_KEY) חסר ב-Secrets!")
    st.stop()

st.set_page_config(page_title="ADCO AI", layout="wide")

# 2. עיצוב RTL (ימין לשמאל)
st.markdown("""
    <style>
    .main { direction: rtl; text-align: right; }
    div[data-testid="stBlock"] { direction: rtl; text-align: right; }
    div[data-testid="stMarkdownContainer"] { text-align: right; direction: rtl; }
    .stButton>button { width: 100%; border-radius: 5px; height: 3.5em; font-weight: bold; background-color: #f0f2f6; }
    table { direction: rtl; margin-left: auto; margin-right: 0; width: 100%; border-collapse: collapse; }
    th { text-align: right !important; background-color: #f8f9fa; padding: 12px; border: 1px solid #dee2e6; }
    td { text-align: right !important; padding: 10px; border: 1px solid #dee2e6; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏗️ ADCO - אומדן כמויות מקצועי")

# 3. ניהול זיכרון למידה
if 'corrections' not in st.session_state:
    st.session_state.corrections = []
if 'analysis_results' not in st.session_state:
    st.session_state.analysis_results = None

with st.sidebar:
    st.header("🧠 זיכרון למידה")
    user_input = st.text_area("הנחיה לתיקון (לדוגמה: 'ספור כל עיגול עם קו כשקע מוגן מים'):")
    if st.button("שמור הנחיה"):
        if user_input:
            st.session_state.corrections.append(user_input)
            st.success("ההנחיה נשמרה")
            st.rerun()
    if st.session_state.corrections:
        st.write("---")
        for i, c in enumerate(st.session_state.corrections):
            col_text, col_btn = st.columns([4, 1])
            with col_text:
                st.info(f"{i+1}. {c}")
            with col_btn:
                if st.button("🗑️", key=f"del_{i}", help="הסר הנחיה"):
                    st.session_state.corrections.pop(i)
                    st.rerun()
        if st.button("נקה זיכרון"):
            st.session_state.corrections = []
            st.session_state.analysis_results = None
            st.rerun()

# 4. ממשק העלאה
col1, col2 = st.columns(2)
with col1:
    plan_file = st.file_uploader("העלי תוכנית PDF", type=["pdf", "png", "jpg", "jpeg"])
with col2:
    price_file = st.file_uploader("מחירון (אופציונלי)", type=["xlsx", "csv"])

# 5. ביצוע הניתוח
if plan_file:
    if st.button("🔍 הפעל ניתוח ADCO (הצגת רשימה על המסך)"):
        with st.spinner("ADCO סורקת את התוכנית..."):
            try:
                # קריאת הקובץ והפיכה ל-Base64
                file_bytes = plan_file.read()
                base64_pdf = base64.b64encode(file_bytes).decode('utf-8')
                corrections_str = "\n".join(st.session_state.corrections)
                
                # פרומפט "חזק" לדיוק מקסימלי
                prompt = f"""
                אתה מעריך כמויות מקצועי. בצע סריקה קפדנית של התוכנית המצורפת.
                
                הוראות מחייבות:
                1. סרוק כל חדר בנפרד (סלון, מטבח, חדרי שינה, רחצה). אל תפספס אף סמל.
                2. הפרדה מלאה: כל סוג שקע או נקודה (שקע כוח, שקע שירות, מוגן מים, תלת פאזי, תאורה, תקשורת) חייב להופיע בשורה נפרדת.
                3. סווג לפרקים: "חשמל ותקשורת", "אינסטלציה וגז", "בנייה והריסה".
                4. הנחיות נוספות: {corrections_str}
                
                החזר אך ורק פורמט JSON תקין במבנה הבא:
                {{
                  "items": [
                    {{
                      "תיאור": "שם הפריט",
                      "מחלקה": "שם הפרק",
                      "יחידה": "יח/מ/מר",
                      "כמות": 5,
                      "הערות": "מיקום או הערה"
                    }}
                  ]
                }}
                """

                api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{"parts": [
                        {"text": prompt}, 
                        {"inline_data": {"mime_type": "application/pdf", "data": base64_pdf}}
                    ]}],
                    "generationConfig": {"temperature": 0.1, "response_mime_type": "application/json"}
                }
                
                res = requests.post(api_url, json=payload)
                data = res.json()
                
                if 'candidates' in data:
                    raw_content = data['candidates'][0]['content']['parts'][0]['text']
                    st.session_state.analysis_results = json.loads(raw_content).get('items', [])
                else:
                    st.error("לא התקבלו נתונים מה-AI. בדקי שהקובץ תקין.")
            except Exception as e:
                st.error(f"שגיאה בתהליך: {e}")

# 6. הצגת תוצאות והורדה
if st.session_state.analysis_results:
    items = st.session_state.analysis_results
    df = pd.DataFrame(items)
    
    st.success(f"✅ נמצאו {len(df)} סעיפים:")
    
    # תצוגה על המסך
    for dept in df['מחלקה'].unique():
        st.subheader(f"📋 {dept}")
        st.table(df[df['מחלקה'] == dept])
    
    # כפתור הורדה
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='כתב כמויות ADCO')
    
    st.write("---")
    st.download_button(
        label="📥 הורד כתב כמויות לאקסל (Excel)",
        data=output.getvalue(),
        file_name=f"ADCO_Estimate_{plan_file.name}.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# 7. ניתוח רגשות בווידאו
st.write("---")
st.header("🎬 ניתוח רגשות בווידאו לעריכה")

video_file = st.file_uploader("העלי קובץ וידאו לניתוח רגשות", type=["mp4", "mov", "avi", "mkv", "webm"])

if video_file:
    if st.button("🎭 נתח רגשות בווידאו"):
        with st.spinner("מעלה ומנתח את הווידאו... (עשוי לקחת מספר שניות)"):
            uploaded_gemini_file = None
            tmp_path = None
            try:
                genai.configure(api_key=gemini_key)

                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(video_file.name)[1]) as tmp:
                    tmp.write(video_file.read())
                    tmp_path = tmp.name

                uploaded_gemini_file = genai.upload_file(tmp_path, mime_type=video_file.type)

                while uploaded_gemini_file.state.name == "PROCESSING":
                    time.sleep(2)
                    uploaded_gemini_file = genai.get_file(uploaded_gemini_file.name)

                if uploaded_gemini_file.state.name == "FAILED":
                    st.error("עיבוד הווידאו נכשל. נסי קובץ אחר.")
                else:
                    model = genai.GenerativeModel("gemini-2.0-flash")
                    prompt = """
                    Analyze this video for emotions and provide video editing suggestions.
                    Identify the emotional content across different segments.

                    Return ONLY valid JSON in this exact structure:
                    {
                      "overall_mood": "description of the overall emotional tone",
                      "segments": [
                        {
                          "timestamp": "00:00-00:10",
                          "emotion": "happiness/sadness/excitement/calm/anger/surprise/fear/neutral",
                          "intensity": "low/medium/high",
                          "edit_suggestion": "specific editing suggestion for this segment"
                        }
                      ],
                      "editing_recommendations": [
                        "general recommendation 1",
                        "general recommendation 2"
                      ],
                      "music_suggestion": "suggested music style or mood"
                    }
                    """
                    response = model.generate_content(
                        [uploaded_gemini_file, prompt],
                        generation_config=genai.GenerationConfig(temperature=0.1, response_mime_type="application/json")
                    )

                    result = json.loads(response.text)

                    st.success(f"🎭 מצב רוח כללי: **{result.get('overall_mood', '')}**")

                    if result.get('music_suggestion'):
                        st.info(f"🎵 הצעת מוזיקה: {result['music_suggestion']}")

                    if result.get('segments'):
                        st.subheader("ניתוח לפי קטעים:")
                        emotion_map = {
                            "happiness": "😊", "sadness": "😢", "excitement": "🤩",
                            "calm": "😌", "anger": "😠", "surprise": "😲",
                            "fear": "😨", "neutral": "😐"
                        }
                        segments_display = []
                        for seg in result['segments']:
                            emoji = emotion_map.get(seg.get('emotion', '').lower(), "🎬")
                            segments_display.append({
                                "זמן": seg.get('timestamp', ''),
                                "רגש": f"{emoji} {seg.get('emotion', '')}",
                                "עוצמה": seg.get('intensity', ''),
                                "המלצת עריכה": seg.get('edit_suggestion', '')
                            })
                        st.table(pd.DataFrame(segments_display))

                    if result.get('editing_recommendations'):
                        st.subheader("המלצות עריכה כלליות:")
                        for rec in result['editing_recommendations']:
                            st.info(f"✂️ {rec}")

            except Exception as e:
                st.error(f"שגיאה בניתוח הווידאו: {e}")
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                if uploaded_gemini_file:
                    try:
                        genai.delete_file(uploaded_gemini_file.name)
                    except Exception:
                        pass
