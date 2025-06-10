import main

if __name__ == '__main__':
    while True:
        try:
            main.run()
        except Exception as e:
            print(f"Server Crashed: {e}")