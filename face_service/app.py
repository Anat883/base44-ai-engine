import io
import os
import pickle
import shutil

import face_recognition
from flask import Flask, jsonify, request

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
TRAINING_DIR = os.path.join(DATA_DIR, 'training')
ENCODINGS_FILE = os.path.join(DATA_DIR, 'encodings.pkl')
TOLERANCE = float(os.environ.get('TOLERANCE', '0.5'))

os.makedirs(TRAINING_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


def _load_encodings():
    if os.path.exists(ENCODINGS_FILE):
        with open(ENCODINGS_FILE, 'rb') as f:
            return pickle.load(f)
    return []


def _save_encodings(encodings):
    with open(ENCODINGS_FILE, 'wb') as f:
        pickle.dump(encodings, f)


# List of dicts: [{'phone': str, 'encoding': ndarray}, ...]
known_encodings = _load_encodings()
print(f"✅ נטענו {len(known_encodings)} encodings עבור {len({e['phone'] for e in known_encodings})} הורים")


@app.route('/parent/add-photo', methods=['POST'])
def add_photo():
    phone = request.form.get('phone')
    if not phone:
        return jsonify({'error': 'phone required'}), 400
    if 'image' not in request.files:
        return jsonify({'error': 'image required'}), 400

    parent_dir = os.path.join(TRAINING_DIR, phone)
    os.makedirs(parent_dir, exist_ok=True)

    count = len([f for f in os.listdir(parent_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    photo_path = os.path.join(parent_dir, f'{count + 1}.jpg')
    request.files['image'].save(photo_path)

    return jsonify({'status': 'ok', 'count': count + 1})


@app.route('/parent/train', methods=['POST'])
def train_parent():
    data = request.get_json()
    phone = (data or {}).get('phone')
    if not phone:
        return jsonify({'error': 'phone required'}), 400

    parent_dir = os.path.join(TRAINING_DIR, phone)
    if not os.path.exists(parent_dir):
        return jsonify({'error': 'no training photos found'}), 404

    new_encodings = []
    for photo_file in sorted(os.listdir(parent_dir)):
        if not photo_file.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        photo_path = os.path.join(parent_dir, photo_file)
        try:
            image = face_recognition.load_image_file(photo_path)
            encs = face_recognition.face_encodings(image)
            new_encodings.extend(encs)
            print(f"  ✅ {phone}/{photo_file} – {len(encs)} פנים")
        except Exception as e:
            print(f"  ❌ שגיאה ב-{photo_file}: {e}")

    global known_encodings
    known_encodings = [e for e in known_encodings if e['phone'] != phone]
    known_encodings.extend({'phone': phone, 'encoding': enc} for enc in new_encodings)
    _save_encodings(known_encodings)

    print(f"✅ אומן הורה {phone}: {len(new_encodings)} encodings")
    return jsonify({'status': 'ok', 'encodings': len(new_encodings)})


@app.route('/check-photo', methods=['POST'])
def check_photo():
    if 'image' not in request.files:
        return jsonify({'error': 'no image provided'}), 400

    image_bytes = request.files['image'].read()

    try:
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        face_encs = face_recognition.face_encodings(image)
    except Exception as e:
        return jsonify({'error': f'could not process image: {e}'}), 500

    if not face_encs:
        return jsonify({'matched_parents': [], 'reason': 'no faces detected'})

    if not known_encodings:
        return jsonify({'matched_parents': [], 'reason': 'no parents registered'})

    all_encs = [e['encoding'] for e in known_encodings]
    matched = set()

    for face_enc in face_encs:
        results = face_recognition.compare_faces(all_encs, face_enc, tolerance=TOLERANCE)
        for i, is_match in enumerate(results):
            if is_match:
                matched.add(known_encodings[i]['phone'])

    return jsonify({'matched_parents': list(matched)})


@app.route('/parent/<phone>', methods=['DELETE'])
def delete_parent(phone):
    global known_encodings
    known_encodings = [e for e in known_encodings if e['phone'] != phone]
    _save_encodings(known_encodings)

    parent_dir = os.path.join(TRAINING_DIR, phone)
    if os.path.exists(parent_dir):
        shutil.rmtree(parent_dir)

    return jsonify({'status': 'ok'})


@app.route('/status', methods=['GET'])
def status():
    by_phone = {}
    for e in known_encodings:
        by_phone[e['phone']] = by_phone.get(e['phone'], 0) + 1
    return jsonify({'parents': by_phone, 'total_encodings': len(known_encodings)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
