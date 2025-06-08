import mysql.connector

print("Connecting...")

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    port=3306
)

cursor = db.cursor()

print("Deleting old database...")

cursor.execute("DROP DATABASE IF EXISTS totskiyloot")

print("Creating new database...")

cursor.execute("CREATE DATABASE totskiyloot")
cursor.execute("USE totskiyloot")

print("Creating tables...")

cursor.execute("CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(60), money INT DEFAULT 1488)")

print("Closing connection...")

db.commit()
cursor.close()
db.close()

print("Done!")