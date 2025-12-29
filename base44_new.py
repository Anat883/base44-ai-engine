import streamlit as st
import requests
import base64
import json
import pandas as pd
from io import BytesIO

# 1. משיכת המפתח מה-Secrets
try:
    gemini_key = st.secrets["GEMINI_KEY"]
except:
    st.error("⚠️ המפתח (GEMINI_KEY) חסר ב-Secrets של Streamlit!")
    st.stop()

# 2. הגדרות עיצוב לימין לשמאל (RTL)
st.markdown("""
    <style>
    .main { direction: rtl; text-align: right; }
    div[data-testid="stBlock"] { direction: rtl; text-align: right; }
    div[data-testid="stMarkdownContainer"] { text-align: right; direction: rtl; }
    .stButton>button { width: 100%; border-radius: 5px; background-color: #f0f2f6; }
    table { direction: rtl; margin-left: auto; margin-right: 0; width: 100%; }
    th { text-align: right !important; }
    td { text-align: right !important; }
    </style>
    """, unsafe_allow_html=True)

st.title("🏗️ ADCO - אומדן כמויות וניתוח תוכניות")

# 3. ניהול תיקונים (למידה) ב-Sidebar
if 'corrections' not in st.session_state:
    st.session_state.corrections = []

with st.sidebar:
    st.header("🧠 זיכרון למידה")
    user_input = st.text_area("הנחיה לתיקון (למשל: 'הריבוע הוא שקע מוגן מים'):")
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

# 4. העלאת קבצים
plan_file = st.file_uploader("העלי תוכנית PDF", type=["pdf", "png", "jpg"])

if plan_file and st.button("הפעל ניתוח"):
    with st.spinner("ADCO מנתחת את הסמלים בתוכנית..."):
        try:
            base64_pdf = base64.b64encode(plan_file.
