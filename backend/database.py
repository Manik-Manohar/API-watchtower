import os
from pathlib import Path
import mysql.connector
from dotenv import load_dotenv

# Resolve path to .env file dynamically relative to this script's directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 4000)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "test")
    )

def create_table():
    create_tables()

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Create 'checks' table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS checks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service_id VARCHAR(50),
            service_name VARCHAR(100),
            status VARCHAR(20),
            status_code INT,
            response_time_ms INT,
            checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Create 'alerts' table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service_id VARCHAR(50),
            service_name VARCHAR(100),
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 3. Migration safety checks for 'checks' table columns
    migrations = [
        "ALTER TABLE checks ADD COLUMN status_code INT AFTER status;",
        "ALTER TABLE checks ADD COLUMN response_time_ms INT AFTER status_code;",
        "ALTER TABLE checks ADD COLUMN service_id VARCHAR(50) AFTER id;",
        "ALTER TABLE alerts ADD COLUMN service_id VARCHAR(50) AFTER id;"
    ]

    for query in migrations:
        try:
            cursor.execute(query)
        except mysql.connector.Error as err:
            # Error 1060: Duplicate column name (column already exists)
            if err.errno != 1060:
                print(f"Migration notice: {err}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Database schema migration complete!")

def get_service_history(service_id=None, limit=50):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    if service_id:
        cursor.execute(
            "SELECT * FROM checks WHERE service_id = %s ORDER BY checked_at DESC LIMIT %s",
            (service_id, limit)
        )
    else:
        cursor.execute(
            "SELECT * FROM checks ORDER BY checked_at DESC LIMIT %s",
            (limit,)
        )
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results

def get_recent_response_trend(service_id=None, limit=20):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    if service_id:
        cursor.execute(
            "SELECT COALESCE(response_time_ms, response_time) AS response_time_ms, checked_at FROM checks WHERE service_id = %s ORDER BY checked_at DESC LIMIT %s",
            (service_id, limit)
        )
    else:
        cursor.execute(
            "SELECT COALESCE(response_time_ms, response_time) AS response_time_ms, checked_at FROM checks ORDER BY checked_at DESC LIMIT %s",
            (limit,)
        )
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results[::-1]  # Chronological order