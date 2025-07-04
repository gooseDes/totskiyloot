import flask
from flask import request, jsonify
from flask_socketio import SocketIO
from bcrypt import gensalt, hashpw, checkpw
from random import randint
import mysql.connector
import jwt
import datetime
import os
from queue import Queue
from threading import Thread
import time
from PIL import Image

SECRET_KEY = 'totskiyloot_epta'
DEBUG = True

task_queue = Queue()
DELAY_BETWEEN_TASKS = 0.0005
DELAY_BETWEEN_REQUESTS = 0.1
last_requests_reload = time.time()
last_leaderboard_update = 0
leaderboard = []

if __name__ == '__main__':
    DEBUG = True
else:
    DEBUG = False

last_requests = {}
last_chat_messages = []

def create_token(username):
    payload = {
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['username']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

connection = mysql.connector.connect(
    host='localhost',
    user='root',
    password='root',
    database='totskiyloot',
    port=3306
)

def get_connection():
    return connection

def request_processed(sid):
    global last_requests
    last_requests[sid] = time.time()

ALLOWED_SYMBOLS = 'abcdefghijklmnopqrstuvwxyz_0123456789'
ALLOWED_SYMBOLS_DESK = "abcdefghijklmnopqrstuvwxyzABCDRFGHIJKLMNOPQRSTUVWXYZ_0123456789 :&*%$@!?.,-+=;()[]'"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def check_nickname(username):
    if len(username) <= 0:
        return False
    if len(username) > 16:
        return False
    for i in range(len(username)):
        if not username[i] in ALLOWED_SYMBOLS:
            return False
    return True

def check_description(description):
    if len(description) > 256:
        return False
    for i in range(len(description)):
        if not description[i] in ALLOWED_SYMBOLS_DESK:
            return False
    return True

app = flask.Flask(__name__)

app.config['UPLOAD_FOLDER'] = './static/avatars'
app.config['MAX_CONTENT_LENGTH'] = 3 * 1024 * 1024

socketio = SocketIO(app, async_mode='threading', cors_allowed_origins='*')

@app.route('/')
def index():
    return flask.render_template('index.html')

@app.route('/index')
def redirect_index():
    return flask.redirect('/')

@app.route('/games')
def games():
    return flask.render_template('games/index.html')

@app.route('/games/<game_name>')
def game(game_name):
    return flask.render_template(f'games/{game_name}/index.html')

@app.route('/signin')
def singin():
    return flask.render_template('signin.html')

@app.route('/signup')
def singup():
    return flask.render_template('signup.html')

@app.route('/profile/<username>')
def user(username):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if not user:
        return flask.render_template('no_user.html'), 404
    cursor.close()
    return flask.render_template('profile.html', username=user[1], money=user[3], description=user[4])

@app.route('/profile/edit/<username>')
def edit_profile(username):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if not user:
        return flask.render_template('no_user.html'), 404
    cursor.close()
    return flask.render_template('edit_profile.html', username=user[1], description=user[4])

@app.route('/leaderboard')
def leaderboard_():
    users = []
    conn = get_connection()
    cursor = conn.cursor()
    for i in leaderboard:
        cursor.execute("SELECT * FROM users WHERE id = %s", (i,))
        user = cursor.fetchone()
        users.append((user[1], user[3]))
    return flask.render_template('leaderboard.html', users=users)

@app.route('/contact')
def contact():
    return flask.redirect('https://youtu.be/dQw4w9WgXcQ?si=MPy6N9DNbb415bdx')

@socketio.on('connect')
def handle_connect():
    pass

@socketio.on('reg')
def handle_registration(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_registration, [data, sid, ip]))

def process_registration(data, sid, ip):
    if not data.get('username') or not data.get('password'):
        socketio.emit('reg_result', {'success': False, 'message': 'Username and password are required.'}, to=sid)
        return
    username = data['username']
    if not check_nickname(username):
        socketio.emit('reg_result', {'success': False, 'message': 'Username contains prohibited characters or too long.'}, to=sid)
        return
    password = data['password']
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        socketio.emit('reg_result', {'success': False, 'message': 'Username already exists.'}, to=sid)
        return
    password = password.encode('utf-8')
    salt = gensalt()
    password = hashpw(password, salt)
    password = password.decode('utf-8')
    cursor.execute("INSERT INTO users (username, password, money, description) VALUES (%s, %s, %s, %s)", (username, password, 1488, 'no description',))
    socketio.emit('reg_result', {'success': True, 'message': 'Registration successful!', 'token': create_token(username)}, to=sid)
    conn.commit()
    cursor.close()
    request_processed(sid)

@socketio.on('login')
def handle_login(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_login, [data, sid, ip]))

def process_login(data, sid, ip):
    if not data.get('username') or not data.get('password'):
        socketio.emit('login_result', {'success': False, 'message': 'Username and password are required.'}, to=sid)
        return
    username = data['username']
    password = data['password'].encode('utf-8')
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if not user:
        socketio.emit('login_result', {'success': False, 'message': 'No user found with that username.'}, to=sid)
        return
    db_password = user[2].encode('utf-8')
    if checkpw(password, db_password):
        socketio.emit('login_result', {'success': True, 'message': 'Login successful!', 'money': user[3], 'token': create_token(username)}, to=sid)
    else:
        socketio.emit('login_result', {'success': False, 'message': 'Incorrect password.'}, to=sid)
    cursor.close()
    request_processed(sid)

@socketio.on('spin')
def handle_spin(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_spin, [data, sid, ip]))

def process_spin(data, sid, ip):
    if not data.get('token'):
        socketio.emit('spin_result', {'success': False, 'message': 'Token is required.'}, to=sid)
        return
    if not data.get('bet'):
        socketio.emit('spin_result', {'success': False, 'message': 'Bet is required.'}, to=sid)
        return
    bet = data['bet']
    if bet < 10:
        socketio.emit('spin_result', {'success': False, 'message': 'Minimal bet is 10 coins.'}, to=sid)
        return
    if bet > 10000:
        socketio.emit('spin_result', {'success': False, 'message': 'Maximal bet is 10000 coins.'}, to=sid)
        return
    spin_result = randint(0, 100)
    username = verify_token(data['token'])
    if not username:
        socketio.emit('spin_result', {'success': False, 'message': 'Invalid or expired token.'}, to=sid)
        return
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT money FROM users WHERE username = %s", (username,))
    money = cursor.fetchone()
    if not money:
        socketio.emit('spin_result', {'success': False, 'message': 'User not found.'}, to=sid)
        return
    money = money[0]
    if spin_result < 90:
        success = True
        money -= bet
        result = 'lose'
    elif spin_result <= 99:
        success = True
        money += bet*5
        result = 'win'
    else:
        success = True
        money += bet*50
        result = 'jackpot'
    socketio.emit('spin_result', {'success': success, 'money': money, 'result': result}, to=sid)
    if money < -5000:
        socketio.emit('spin_result', {'success': False, 'message': f'Hi! :3\nYout IP: {ip}\nCollectors are coming for you...'}, to=sid)
    cursor.execute("UPDATE users SET money = %s WHERE username = %s", (money, username))
    conn.commit()
    cursor.close()
    request_processed(sid)

@socketio.on('generate_mines')
def handle_generate_mines(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_generate_mines, [data, sid, ip]))

def process_generate_mines(data, sid, ip):
    if not data.get('token'):
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Token is required.'}, to=sid)
        return
    if not data.get('bet'):
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Bet is required.'}, to=sid)
        return
    if not data.get('amount'):
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Amount is required.'}, to=sid)
        return
    token = data['token']
    bet = data['bet']
    amount = data['amount']
    if amount > 36:
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Max number of mines is 36.'}, to=sid)
        return
    if amount < 12:
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Minimal number of mines is 12'}, to=sid)
        return
    if bet < 10:
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Minimal bet is 10 coins.'}, to=sid)
        return
    if bet > 10000:
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Maximal bet is 10000 coins.'}, to=sid)
        return
    username = verify_token(token)
    if not username:
        socketio.emit('generate_mines_result', {'success': False, 'message': 'Invalid or expired token.'}, to=sid)
        return
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT money FROM users WHERE username = %s', (username,))
    money = cursor.fetchall()
    if not money:
        socketio.emit('generate_mines_result', {'success': False, 'message': 'User not found.'}, to=sid)
        return
    money = money[0][0]
    mines = []
    start_bet = bet
    for i in range(amount):
        rand = randint(0, 20)
        if rand <= 0:
            mines.append('x0')
            bet = 0
        elif rand <= 10:
            mines.append('+0.5')
            bet += 0.5*start_bet
        elif rand <= 19:
            mines.append('-0.5')
            bet -= 0.5*start_bet
        else:
            mines.append('x2')
            bet *= 2
    money += bet
    cursor.execute('UPDATE users SET money = %s WHERE username = %s', (money, username,))
    conn.commit()
    socketio.emit('generate_mines_result', {'success': True, 'mines': mines}, to=sid)
    cursor.close()

@socketio.on('get_money')
def handle_get_money(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_get_money, [data, sid, ip]))

def process_get_money(data, sid, ip):
    if not data.get('token'):
        socketio.emit('get_money_result', {'success': False, 'message': 'Token is required.'}, to=sid)
        return
    username = verify_token(data['token'])
    if not username:
        socketio.emit('get_money_result', {'success': False, 'message': 'Invalid or expired token.'}, to=sid)
        return
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT money FROM users WHERE username = %s", (username,))
    money = cursor.fetchone()
    if not money:
        socketio.emit('get_money_result', {'success': False, 'message': 'User not found.'}, to=sid)
        return
    money = money[0]
    socketio.emit('get_money_result', {'success': True, 'money': money}, to=sid)
    cursor.close()
    request_processed(sid)

@socketio.on('verify_token')
def handle_verify_token(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_verify_token, [data, sid, ip]))

def process_verify_token(data, sid, ip):
    if not data.get('token'):
        socketio.emit('verify_token_result', {'success': False, 'message': 'Token is required.'}, to=sid)
        return
    if verify_token(data['token']):
        valid = True
    else:
        valid = False
    socketio.emit('verify_token_result', {'success': True, 'valid': valid}, to=sid)
    print('verify_token_result', {'success': True, 'valid': valid}, sid)
    request_processed(sid)

@app.route('/upload-avatar', methods=['POST'])
def upload_avatar():
    token = request.form.get('token')
    file = request.files.get('avatar')

    if not token or not file:
        return jsonify(success=False, message='Token and file is required.')

    if not allowed_file(file.filename):
        return jsonify(success=False, message='Invalid file type.')

    try:
        img = Image.open(file.stream).convert('RGB')
        webp_filename = f"{verify_token(token)}.webp"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], webp_filename)
        img.save(save_path, 'webp', quality=80)
        return jsonify(success=True, avatar_url=f"/static/avatars/{webp_filename}")
    except Exception as e:
        return jsonify(success=False, message=f"Image conversion failed: {str(e)}")

@socketio.on('change_username')
def handle_change_username(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_change_username, [data, sid, ip]))

def process_change_username(data, sid, ip):
    if not data.get('token'):
        socketio.emit('change_username_result', {'success': False, 'message': 'Token is required.'}, to=sid)
        return
    if not data.get('username'):
        socketio.emit('change_username_result', {'success': False, 'message': 'Username is required.'}, to=sid)
        return
    token = data['token']
    new_username = data['username']
    if not check_nickname(new_username):
        socketio.emit('change_username_result', {'success': False, 'message': 'Username contains prohibited characters or too long.'}, to=sid)
        return
    username = verify_token(token)
    if not username:
        socketio.emit('change_username_result', {'success': False, 'message': 'Invalid or expired token.'}, to=sid)
        return
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = %s", (new_username,))
    if cursor.fetchone():
        socketio.emit('change_username_result', {'success': False, 'message': 'Username is already taken.'}, to=sid)
        return
    cursor.execute("UPDATE users SET username = %s WHERE username = %s", (new_username, username,))
    conn.commit()
    socketio.emit('change_username_result', {'success': True, 'token': create_token(new_username)}, to=sid)
    cursor.close()
    if os.path.exists(f'./static/avatars/{username}.webp'):
        try:
            os.rename(f'./static/avatars/{username}.webp', f'./static/avatars/{new_username}.webp')
        except:
            pass
    request_processed(sid)

@socketio.on('change_description')
def handle_change_description(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_change_description, [data, sid, ip]))

def process_change_description(data, sid, ip):
    if not data.get('token'):
        socketio.emit('change_description_result', {'success': False, 'message': 'Token is required.'}, to=sid)
        return
    if not data.get('description'):
        socketio.emit('change_description_result', {'success': False, 'message': 'Description is required.'}, to=sid)
        return
    token = data['token']
    description = data['description']
    if not check_description(description):
        socketio.emit('change_description_result', {'success': False, 'message': 'Description contains prohibited characters or too long.'}, to=sid)
        return
    username = verify_token(token)
    if not username:
        socketio.emit('change_description_result', {'success': False, 'message': 'Invalid or expired token.'}, to=sid)
        return
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET description = %s WHERE username = %s", (description, username,))
    conn.commit()
    socketio.emit('change_description_result', {'success': True}, to=sid)
    cursor.close()
    request_processed(sid)

@socketio.on('get_last_messages')
def handle_get_last_messages(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_get_last_messages, [data, sid, ip]))

def process_get_last_messages(data, sid, ip):
    socketio.emit('get_last_messages_result', {'success': True, 'messages': last_chat_messages}, to=sid)

@socketio.on('send_message')
def handle_send_message(data):
    ip = request.remote_addr
    sid = request.sid
    task_queue.put((process_send_message, [data, sid, ip]))

def process_send_message(data, sid, ip):
    if not data.get('token'):
        socketio.emit('send_message_result', {'success': False, 'message': 'Token is required.'}, to=sid)
        return
    if not data.get('message'):
        socketio.emit('send_message_result', {'success': False, 'message': 'Message is required.'}, to=sid)
        return
    token = data['token']
    message = data['message']
    if len(message) > 256:
        socketio.emit('send_message_result', {'success': False, 'message': 'Message is too long.'}, to=sid)
        return
    username = verify_token(token)
    if not username:
        socketio.emit('send_message_result', {'success': False, 'message': 'Invalid or expired token.'}, to=sid)
        return
    socketio.emit('new_message', {'author': username, 'message': message})
    last_chat_messages.append({'author': username, 'message': message})
    if len(last_chat_messages) > 20:
        last_chat_messages.pop(0)
    socketio.emit('send_message_result', {'success': True}, to=sid)

def task_worker():
    while True:
        if time.time() - last_leaderboard_update > 120:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users ORDER BY money DESC")
            data = cursor.fetchall()
            leaderboard.clear()
            for i in data:
                leaderboard.append(i[0])
            cursor.close()
        func, args = task_queue.get()
        if (not last_requests.get(args[1])) or (time.time() - last_requests.get(args[1]) > DELAY_BETWEEN_REQUESTS):
            try:
                func(*args)
            except Exception as e:
                print("Task error:", e)
            time.sleep(DELAY_BETWEEN_TASKS)
        task_queue.task_done()
        if time.time() - last_requests_reload > 30:
            last_requests.clear()

def run():
    Thread(target=task_worker, daemon=True).start()
    if os.path.exists('./fullchain.pem') and os.path.exists('./privkey.pem'):
        socketio.run(app, host='0.0.0.0', port=5001, debug=DEBUG, ssl_context=('./fullchain.pem', './privkey.pem'))
    else:
        socketio.run(app, host='0.0.0.0', port=5000, debug=DEBUG)

if __name__ == '__main__':
    run()