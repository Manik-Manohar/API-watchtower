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
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

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
            response_time INT,
            checked_at DATETIME
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
    
    # 3. Migration safety check: ensure 'service_id' exists in 'alerts' table
    try:
        cursor.execute("ALTER TABLE alerts ADD COLUMN service_id VARCHAR(50) AFTER id;")
    except mysql.connector.Error as err:
        # Ignore error 1060 (Duplicate column name) if it already exists
        if err.errno != 1060:
            print(f"Migration notice: {err}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Database schema migration complete!")