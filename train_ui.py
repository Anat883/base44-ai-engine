import os
import shutil
import requests
from pathlib import Path

import streamlit as st

FACES_DIR = Path("faces")
FACE_SERVICE_URL = os.environ.get("FACE_SERVICE_URL", "http://localhost:5000")

st.set_page_config(page_title="אימון הרובוט – זיהוי ילדים", layout="wide")
st.markdown("""
    <style>
    .main { direction: rtl; text-align: right; }
    div[data-testid="stMarkdownContainer"] { text-align: right; direction: rtl; }
    .stButton>button { border-radius: 6px; font-weight: bold; }
    </style>
""", unsafe_allow_html=True)

st.title("🧒 אימון הרובוט – זיהוי ילדים")
st.write("העלי תמונות של הילדים שלך כדי שהרובוט ילמד לזהות אותם בתמונות הגן")

FACES_DIR.mkdir(exist_ok=True)

# ── Add child ──────────────────────────────────────────────
st.header("➕ הוסף ילד/ה חדש")

col1, col2 = st.columns([1, 2])

with col1:
    child_name = st.text_input("שם הילד/ה:")

with col2:
    photos = st.file_uploader(
        "העלי 3–10 תמונות ברורות של הפנים (פנים קדמיות, תאורה טובה)",
        type=["jpg", "jpeg", "png"],
        accept_multiple_files=True,
        key="upload"
    )

if st.button("💾 שמור ילד/ה"):
    if not child_name.strip():
        st.error("נא להזין שם")
    elif not photos:
        st.error("נא להעלות לפחות תמונה אחת")
    else:
        child_dir = FACES_DIR / child_name.strip()
        child_dir.mkdir(exist_ok=True)
        saved = 0
        for i, photo in enumerate(photos):
            suffix = Path(photo.name).suffix.lower() or '.jpg'
            save_path = child_dir / f"{i+1}{suffix}"
            save_path.write_bytes(photo.read())
            saved += 1

        st.success(f"✅ נשמרו {saved} תמונות עבור **{child_name}**")

        with st.spinner("מעדכן את הרובוט..."):
            try:
                resp = requests.post(f"{FACE_SERVICE_URL}/reload", timeout=120)
                data = resp.json()
                st.info(f"הרובוט עודכן! נטענו {data.get('total', '?')} פנים מוכרות")
            except Exception:
                st.warning("שירות הזיהוי לא פעיל כרגע. התמונות נשמרו ויטענו כשהשירות יעלה.")

        st.rerun()

st.divider()

# ── Registered children ────────────────────────────────────
st.header("👨‍👩‍👧 ילדים רשומים")

children = sorted([d.name for d in FACES_DIR.iterdir() if d.is_dir()])

if not children:
    st.info("אין ילדים רשומים עדיין. הוסיפי ילד/ה למעלה.")
else:
    try:
        resp = requests.get(f"{FACE_SERVICE_URL}/status", timeout=5)
        enc_counts = resp.json().get('children', {})
        service_live = True
    except Exception:
        enc_counts = {}
        service_live = False

    if not service_live:
        st.warning("שירות הזיהוי לא פעיל כרגע – הפעילי את start.sh")

    for child in children:
        photo_count = len(list((FACES_DIR / child).glob("*.*")))
        enc_count = enc_counts.get(child, "?")

        c1, c2, c3 = st.columns([3, 2, 1])
        with c1:
            st.write(f"**{child}**")
        with c2:
            st.write(f"{photo_count} תמונות / {enc_count} פנים זוהו")
        with c3:
            if st.button("🗑️ מחק", key=f"del_{child}"):
                shutil.rmtree(FACES_DIR / child)
                try:
                    requests.post(f"{FACE_SERVICE_URL}/reload", timeout=120)
                except Exception:
                    pass
                st.rerun()

st.divider()
st.caption("הדרכה: העלי לפחות 5 תמונות לכל ילד – תמונות שונות, מזוויות שונות, עם תאורה טובה.")
