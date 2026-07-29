from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_db

app = Flask(__name__)
CORS(app)  # allows the static frontend (different origin) to call this API


@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json

    username = data.get('username')
    email = data.get('user_email')
    password = data.get('user_password')

    if not username or not email or not password:
        return jsonify({"success": False, "error": "Champs manquants."}), 400

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT user_id FROM users WHERE user_email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        db.close()
        return jsonify({"success": False, "error": "Email déjà utilisé."}), 409

    sql = "INSERT INTO users (username, user_email, user_password, user_role, created_at) VALUES (%s, %s, %s, %s, NOW())"
    cursor.execute(sql, (username, email, password, '0'))
    db.commit()
    new_id = cursor.lastrowid

    cursor.close()
    db.close()
    return jsonify({"success": True, "user_id": new_id})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT user_id, username, user_role FROM users WHERE user_email = %s AND user_password = %s",
        (email, password)
    )
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if user:
        return jsonify({"success": True, "user": user})
    else:
        return jsonify({"success": False, "error": "Email ou mot de passe incorrect."}), 401


@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    data = request.json

    titre = data.get('title')
    description = data.get('description')
    categorie = data.get('category')
    priorite = data.get('priority')
    user_id = data.get('user_id')

    if not titre or not description or not categorie or not priorite:
        return jsonify({"success": False, "error": "Champs manquants."}), 400

    db = get_db()
    cursor = db.cursor()
    sql = """INSERT INTO ticket (titre, categorie, priorite, description_ticket, user_id, statut, created_at)
             VALUES (%s, %s, %s, %s, %s, %s, NOW())"""
    cursor.execute(sql, (titre, categorie, priorite, description, user_id, 'nouveau'))
    db.commit()
    new_id = cursor.lastrowid

    cursor.close()
    db.close()
    return jsonify({"success": True, "ticket_id": new_id})


@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT ticket_id, titre, categorie, priorite, statut, created_at
        FROM ticket
        ORDER BY created_at DESC
    """)
    tickets = cursor.fetchall()
    cursor.close()
    db.close()

    for t in tickets:
        t['created_at'] = t['created_at'].isoformat()

    return jsonify(tickets)


if __name__ == '__main__':
    app.run(debug=True, port=5000)