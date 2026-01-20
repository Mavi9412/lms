import sqlite3
import os

db_path = "./lms.db"

if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
else:
    print(f"Database found at {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\nTables:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        print(f" - {table[0]}")
        
    print("\nUsers:")
    try:
        cursor.execute("SELECT * FROM user")
        users = cursor.fetchall()
        for user in users:
            print(user)
        if not users:
            print("No users found.")
    except sqlite3.OperationalError as e:
        print(f"Error reading user table: {e}")

    conn.close()
    print("\nConnection closed.")

except Exception as e:
    print(f"Database connection failed: {e}")
