import mysql.connector

connection = mysql.connector.connect(
    host='localhost',
    user='root',
    password='root',
    database='totskiyloot',
    port=3306
)

cursor = connection.cursor()

if connection.is_connected():
    print('Connected!')

cursor.execute("SHOW TABLES")

tables = cursor.fetchall()
print("List of all tables:")
for table in tables:
    print(table[0])

for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT * FROM {table_name}")
    table_content = cursor.fetchall()
    print(f"\nTable {table_name} contains:")
    for row in table_content:
        print(row)

cursor.close()
connection.close()