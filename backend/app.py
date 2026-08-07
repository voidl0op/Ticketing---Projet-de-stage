from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from db import get_db

app = Flask(__name__)
CORS(app)  # allows the static frontend (different origin) to call this API
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB cap per request


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

    try:
        cursor.execute(
            "SELECT user_id FROM users WHERE user_email = %s OR username = %s",
            (email, username)
        )
        if cursor.fetchone():
            return jsonify({"success": False, "error": "Email ou nom d'utilisateur déjà utilisé."}), 409

        sql = "INSERT INTO users (username, user_email, user_password, user_role, created_at) VALUES (%s, %s, %s, %s, NOW())"
        cursor.execute(sql, (username, email, password, '2'))
        db.commit()
        new_id = cursor.lastrowid
        return jsonify({"success": True, "user_id": new_id})

    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "error": "Erreur serveur lors de l'inscription."}), 500

    finally:
        cursor.close()
        db.close()


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
    # multipart/form-data now (not JSON) since this route accepts file uploads
    titre = request.form.get('title')
    description = request.form.get('description')
    categorie = request.form.get('category')
    priorite = request.form.get('priority')
    user_id = request.form.get('user_id')

    if not titre or not description or not categorie or not priorite:
        return jsonify({"success": False, "error": "Champs manquants."}), 400

    db = get_db()
    cursor = db.cursor()
    sql = """INSERT INTO ticket (titre, categorie, priorite, description_ticket, user_id, statut, created_at)
             VALUES (%s, %s, %s, %s, %s, %s, NOW())"""
    cursor.execute(sql, (titre, categorie, priorite, description, user_id, 'nouveau'))
    db.commit()
    new_id = cursor.lastrowid

    # Optional attachments — the form fields are named 'screenshot' and 'log'
    for field_name in ('screenshot', 'log'):
        file = request.files.get(field_name)
        if file and file.filename:
            file_data = file.read()
            cursor.execute(
                """INSERT INTO ticket_attachment (ticket_id, original_name, mime_type, file_size, file_data, uploaded_at)
                   VALUES (%s, %s, %s, %s, %s, NOW())""",
                (new_id, file.filename, file.mimetype, len(file_data), file_data)
            )
    db.commit()

    cursor.close()
    db.close()
    return jsonify({"success": True, "ticket_id": new_id})


@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"success": False, "error": "user_id manquant."}), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT ticket_id, titre, categorie, priorite, statut, created_at
        FROM ticket
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    tickets = cursor.fetchall()
    cursor.close()
    db.close()

    for t in tickets:
        t['created_at'] = t['created_at'].isoformat()

    return jsonify(tickets)


@app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
def get_ticket_detail(ticket_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT ticket_id, titre, categorie, priorite, description_ticket, statut, created_at, user_id
        FROM ticket
        WHERE ticket_id = %s
    """, (ticket_id,))
    ticket = cursor.fetchone()

    if not ticket:
        cursor.close()
        db.close()
        return jsonify({"success": False, "error": "Ticket introuvable."}), 404

    ticket['created_at'] = ticket['created_at'].isoformat()

    cursor.execute("""
        SELECT attachment_id, original_name, mime_type, file_size
        FROM ticket_attachment
        WHERE ticket_id = %s
    """, (ticket_id,))
    ticket['attachments'] = cursor.fetchall()

    cursor.close()
    db.close()
    return jsonify(ticket)


@app.route('/api/attachments/<int:attachment_id>', methods=['GET'])
def get_attachment(attachment_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT original_name, mime_type, file_data
        FROM ticket_attachment
        WHERE attachment_id = %s
    """, (attachment_id,))
    attachment = cursor.fetchone()
    cursor.close()
    db.close()

    if not attachment:
        return jsonify({"success": False, "error": "Fichier introuvable."}), 404

    return Response(
        attachment['file_data'],
        mimetype=attachment['mime_type'] or 'application/octet-stream',
        headers={'Content-Disposition': f'inline; filename="{attachment["original_name"]}"'}
    )


if __name__ == '__main__':
    app.run(debug=True, port=5000)