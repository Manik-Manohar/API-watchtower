import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from services import check_all_services
from database import get_connection, get_service_history, get_recent_response_trend, create_table

app = Flask(__name__)
CORS(app)

# Automatically create missing database tables on boot
try:
    create_table()
except Exception as e:
    print(f"Error initializing database tables: {e}")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/services")
def services():
    try:
        return jsonify(check_all_services())
    except Exception as e:
        print(f"Error fetching services: {e}")
        return jsonify([])

def scheduled_check():
    print("Running scheduled check...")
    try:
        check_all_services()
    except Exception as e:
        print(f"Error during scheduled check: {e}")

# Initialize background scheduler for monitoring
scheduler = BackgroundScheduler()
scheduler.add_job(scheduled_check, "interval", seconds=30)
scheduler.start()

@app.route("/api/alerts")
def alerts():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50")
        result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        return jsonify([])
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route("/api/services/<service_id>/history")
def service_history(service_id):
    limit = request.args.get("limit", default=50, type=int)
    try:
        return jsonify(get_service_history(service_id, limit))
    except Exception as e:
        print(f"Error fetching service history: {e}")
        return jsonify([])

@app.route("/api/response-trend")
def response_trend():
    limit = request.args.get("limit", default=10, type=int)
    service_id = request.args.get("service_id", default=None, type=str)
    try:
        return jsonify(get_recent_response_trend(service_id=service_id, limit=limit))
    except Exception as e:
        print(f"Error fetching response trend: {e}")
        return jsonify([])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)