import main

if __name__ == '__main__':
    while True:
        try:
            main.socketio.run(main.app, host='0.0.0.0', port=main.os.getenv("PORT", 5000))
        except Exception as e:
            print(f"Server Crashed: {e}")