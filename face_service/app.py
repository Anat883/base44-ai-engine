import os
import io
import pickle

import face_recognition
from flask import Flask, jsonify, request

app = Flask(__name__)

FACES_DIR = os.path.join(os.path.dirname(__file__), '..', 'faces')
ENCODINGS_FILE = os.path.join(os.path.dirname(__file__), 'encodings.pkl')
TOLERANCE = float(os.environ.get('TOLERANCE', '0.5'))


def _build_encodings_from_photos():
    all_encodings = []
    if not os.path.exists(FACES_DIR):
        return all_encodings

    for child_name in os.listdir(FACES_DIR):
        child_dir = os.path.join(FACES_DIR, child_name)
        if not os.path.isdir(child_dir):
            continue
        for photo_file in os.listdir(child_dir):
            if not photo_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            photo_path = os.path.join(child_dir, photo_file)
            try:
                image = face_recognition.load_image_file(photo_path)
                encodings = face_recognition.face_encodings(image)
                for enc in encodings:
                    all_encodings.append({'name': child_name, 'encoding': enc})
                print(f"  ✅ {child_name}/{photo_file} – נמצאו {len(encodings)} פנים")
            except Exception as e:
                print(f"  ❌ שגיאה ב-{photo_path}: {e}")

    return all_encodings


def load_encodings():
    if os.path.exists(ENCODINGS_FILE):
        with open(ENCODINGS_FILE, 'rb') as f:
            return pickle.load(f)
    return []


def save_and_reload():
    global known_encodings
    print("🔄 בונה encodings מחדש מתמונות הייחוס...")
    known_encodings = _build_encodings_from_photos()
    with open(ENCODINGS_FILE, 'wb') as f:
        pickle.dump(known_encodings, f)
    print(f"✅ נטענו {len(known_encodings)} encodings")
    return known_encodings


# Load on startup
known_encodings = load_encodings()
if not known_encodings:
    save_and_reload()
else:
    print(f"✅ נטענו {len(known_encodings)} encodings מהמטמון")


@app.route('/check-photo', methods=['POST'])
def check_photo():
    if 'image' not in request.files:
        return jsonify({'error': 'no image provided'}), 400

    image_bytes = request.files['image'].read()

    try:
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        face_encodings = face_recognition.face_encodings(image)
    except Exception as e:
        return jsonify({'error': f'could not process image: {e}'}), 500

    if not face_encodings:
        return jsonify({'match': False, 'reason': 'no faces detected'})

    if not known_encodings:
        return jsonify({'match': False, 'reason': 'no children registered yet'})

    known_encs = [e['encoding'] for e in known_encodings]

    for face_enc in face_encodings:
        matches = face_recognition.compare_faces(known_encs, face_enc, tolerance=TOLERANCE)
        if any(matches):
            matched_names = list({known_encodings[i]['name'] for i, m in enumerate(matches) if m})
            return jsonify({'match': True, 'children': matched_names})

    return jsonify({'match': False})


@app.route('/reload', methods=['POST'])
def reload_encodings():
    save_and_reload()
    children = {}
    for e in known_encodings:
        children[e['name']] = children.get(e['name'], 0) + 1
    return jsonify({'status': 'ok', 'total': len(known_encodings), 'children': children})


@app.route('/status', methods=['GET'])
def status():
    children = {}
    for e in known_encodings:
        children[e['name']] = children.get(e['name'], 0) + 1
    return jsonify({'children': children, 'total_encodings': len(known_encodings)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
