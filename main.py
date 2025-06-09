import flask
from flask import request
from flask_socketio import SocketIO
from bcrypt import gensalt, hashpw, checkpw
from random import randint
import mysql.connector
import jwt
import datetime
import os

SECRET_KEY = 'totskiyloot_epta'

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

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="totskiyloot",
    port=3306
)

cursor = db.cursor()

app = flask.Flask(__name__)

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
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if not user:
        return flask.render_template('no_user.html'), 404
    return flask.render_template('profile.html', username=user[1], money=user[3])

@socketio.on('connect')
def handle_connect():
    socketio.emit('message', {'data': 'Welcome :3'})

@socketio.on('reg')
def handle_registration(data):
    if not data.get('username') or not data.get('password'):
        socketio.emit('reg_result', {'success': False, 'message': 'Username and password are required.'}, to=request.sid)
        return
    username = data['username']
    password = data['password']
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        socketio.emit('reg_result', {'success': False, 'message': 'Username already exists.'}, to=request.sid)
        return
    password = password.encode('utf-8')
    salt = gensalt()
    password = hashpw(password, salt)
    password = password.decode('utf-8')
    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
    db.commit()
    socketio.emit('reg_result', {'success': True, 'message': 'Registration successful!', 'token': create_token(username)}, to=request.sid)

@socketio.on('login')
def handle_login(data):
    if not data.get('username') or not data.get('password'):
        socketio.emit('login_result', {'success': False, 'message': 'Username and password are required.'}, to=request.sid)
        return
    username = data['username']
    password = data['password'].encode('utf-8')
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if not user:
        socketio.emit('login_result', {'success': False, 'message': 'No user found with that username.'}, to=request.sid)
        return
    db_password = user[2].encode('utf-8')
    if checkpw(password, db_password):
        socketio.emit('login_result', {'success': True, 'message': 'Login successful!', 'money': user[3], 'token': create_token(username)}, to=request.sid)
    else:
        socketio.emit('login_result', {'success': False, 'message': 'Incorrect password.'}, to=request.sid)

@socketio.on('spin')
def handle_message(data):
    if not data.get('token'):
        socketio.emit('spin_result', {'success': False, 'message': 'Token is required.'}, to=request.sid)
        return
    spin_result = randint(0, 100)
    username = verify_token(data['token'])
    if not username:
        socketio.emit('spin_result', {'success': False, 'message': 'Invalid or expired token.'}, to=request.sid)
        return
    cursor.execute("SELECT money FROM users WHERE username = %s", (username,))
    money = cursor.fetchone()
    if not money:
        socketio.emit('spin_result', {'success': False, 'message': 'User not found.'}, to=request.sid)
        return
    money = money[0]
    if spin_result < 90:
        success = True
        money -= 150
        result = 'lose'
    elif spin_result <= 99:
        success = True
        money += 1000
        result = 'win'
    else:
        success = True
        money += 10000
        result = 'jackpot'
    socketio.emit('spin_result', {'success': success, 'money': money, 'result': result}, to=request.sid)
    cursor.execute("UPDATE users SET money = %s WHERE username = %s", (money, username))
    db.commit()

@socketio.on('get_money')
def handle_get_money(data):
    if not data.get('token'):
        socketio.emit('get_money_result', {'success': False, 'message': 'Token is required.'}, to=request.sid)
        return
    username = verify_token(data['token'])
    if not username:
        socketio.emit('get_money_result', {'success': False, 'message': 'Invalid or expired token.'}, to=request.sid)
        return
    cursor.execute("SELECT money FROM users WHERE username = %s", (username,))
    money = cursor.fetchone()
    if not money:
        socketio.emit('get_money_result', {'success': False, 'message': 'User not found.'}, to=request.sid)
        return
    money = money[0]
    socketio.emit('get_money_result', {'success': True, 'money': money}, to=request.sid)

@socketio.on('verify_token')
def handle_verify_token(data):
    if not data.get('token'):
        socketio.emit('verify_token_result', {'success': False, 'message': 'Token is required.'}, to=request.sid)
        return
    if verify_token(data['token']):
        valid = True
    else:
        valid = False
    socketio.emit('verify_token_result', {'success': True, 'valid': valid}, to=request.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=os.getenv("PORT", 5000), debug=True)