from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect, url_for
import os
from werkzeug.utils import secure_filename
import sqlite3
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'  # Change this to a secure key in production

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

DB_FILE = 'receipts.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER,
        roomNumber TEXT,
        studyLevel TEXT,
        studentId TEXT,
        amount REAL,
        transferDate TEXT,
        notes TEXT,
        imagePath TEXT,
        FOREIGN KEY (projectId) REFERENCES projects (id)
    )''')

    # Check if projectId column exists, if not, add it
    cursor = conn.execute("PRAGMA table_info(receipts)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'projectId' not in columns:
        conn.execute('ALTER TABLE receipts ADD COLUMN projectId INTEGER')

    # Insert a default project if none exist
    cursor = conn.execute('SELECT COUNT(*) as count FROM projects')
    existing_projects = cursor.fetchone()[0]
    if existing_projects == 0:
        conn.execute('INSERT INTO projects (name, description) VALUES ("Default Collection", "Default project for collecting receipts")')

    conn.commit()
    conn.close()

init_db()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/submit/<int:project_id>')
def submit(project_id):
    conn = get_db_connection()
    project = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
    conn.close()
    if not project:
        return 'Project not found', 404
    return render_template('submit.html', project=dict(project))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == 'admin123':  # Change this to a secure password in production
            session['logged_in'] = True
            return redirect(url_for('admin'))
        else:
            return render_template('login.html', error='Invalid password')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('home'))

@app.route('/admin')
def admin():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('admin.html')

@app.route('/upload', methods=['POST'])
def upload():
    data = request.form
    file = request.files.get('receiptImage')
    if file:
        filename = secure_filename(str(datetime.now()) + '_' + file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        # Parse dd/mm/yyyy to YYYY-MM-DD
        date_dd_mm_yyyy = data['transferDate']
        if date_dd_mm_yyyy:
            d, m, y = date_dd_mm_yyyy.split('/')
            transferDate = f'{y}-{m}-{d}'
        else:
            transferDate = None
        conn = get_db_connection()
        conn.execute('INSERT INTO receipts (projectId, roomNumber, studyLevel, studentId, amount, transferDate, notes, imagePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                     (data.get('projectSelect', None), data['roomSelect'], data['studyLevel'], data['studentId'], data['amount'], transferDate, data.get('notes', ''), filename))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 200
    return jsonify({'success': False}), 400

@app.route('/receipts')
def get_receipts():
    conn = get_db_connection()
    receipts = conn.execute('SELECT r.*, p.name as projectName FROM receipts r LEFT JOIN projects p ON r.projectId = p.id ORDER BY r.id DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in receipts])

@app.route('/summary')
def get_summary():
    conn = get_db_connection()
    # Summary by project, left join to get project name
    summary = conn.execute('SELECT p.name as project, COUNT(r.id) as count, SUM(r.amount) as total FROM projects p LEFT JOIN receipts r ON p.id = r.projectId GROUP BY p.id, p.name ORDER BY p.name').fetchall()
    conn.close()
    return jsonify([dict(row) for row in summary])

@app.route('/projects')
def get_projects():
    conn = get_db_connection()
    projects = conn.execute('SELECT * FROM projects ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in projects])

@app.route('/projects', methods=['POST'])
def create_project():
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    if not name:
        return jsonify({'success': False, 'error': 'Project name is required'}), 400
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO projects (name, description) VALUES (?, ?)', (name, description))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'error': 'Project name already exists'}), 400
    conn.close()
    if request.is_json:
        return jsonify({'success': True}), 201
    return '<script>alert("Project created successfully."); window.location.href="/admin";</script>'

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
