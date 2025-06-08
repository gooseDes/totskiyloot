import flask
from flask_socketio import SocketIO
from bcrypt import gensalt, hashpw, checkpw
from random import randint
import mysql.connector
import jwt
import datetime

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

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="totskiyloot",
    port=3306
)

cursor = db.cursor()

app = flask.Flask(__name__)

socketio = SocketIO(app, cors_allowed_origins='*')

@app.route('/')
def index():
    return flask.render_template('index.html')

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

@socketio.on('connect')
def handle_connect():
    socketio.emit('message', {'data': 'Welcome :3'})

@socketio.on('reg')
def handle_registration(data):
    if not data.get('username') or not data.get('password'):
        socketio.emit('reg_result', {'success': False, 'message': 'Username and password are required.'})
        return
    username = data['username']
    password = data['password']
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        socketio.emit('reg_result', {'success': False, 'message': 'Username already exists.'})
        return
    password = password.encode('utf-8')
    salt = gensalt()
    password = hashpw(password, salt)
    password = password.decode('utf-8')
    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
    db.commit()
    socketio.emit('reg_result', {'success': True, 'message': 'Registration successful!', 'token': create_token(username)})

@socketio.on('login')
def handle_login(data):
    if not data.get('username') or not data.get('password'):
        socketio.emit('login_result', {'success': False, 'message': 'Username and password are required.'})
        return
    username = data['username']
    password = data['password'].encode('utf-8')
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if not user:
        socketio.emit('login_result', {'success': False, 'message': 'No user found with that username.'})
        return
    db_password = user[2].encode('utf-8')
    if checkpw(password, db_password):
        socketio.emit('login_result', {'success': True, 'message': 'Login successful!', 'money': user[3], 'token': create_token(username)})
    else:
        socketio.emit('login_result', {'success': False, 'message': 'Incorrect password.'})

@socketio.on('spin')
def handle_message(data):
    if not data.get('token'):
        socketio.emit('spin_result', {'success': False, 'message': 'Token is required.'})
        return
    spin_result = randint(0, 100)
    if spin_result < 90:
        socketio.emit('spin_result', {'success': True, 'money': -150, 'result': 'lose'})
    elif spin_result <= 99:
        socketio.emit('spin_result', {'success': True, 'money': 1000, 'result': 'win'})
    else:
        socketio.emit('spin_result', {'success': True, 'money': 10000, 'result': 'jackpot'})


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)