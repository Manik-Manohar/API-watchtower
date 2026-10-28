import requests
import time
from database import get_connection

MONITORED_SERVICES = [
    {"id": 1, "name": "JSONPlaceholder", "url": "https://jsonplaceholder.typicode.com/posts/1"},
    {"id": 2, "name": "Open-Meteo Weather", "url": "https://api.open-meteo.com/v1/forecast?latitude=17.38&longitude=78.48&current_weather=true"},
    {"id": 3, "name": "GitHub API", "url": "https://api.github.com"},
    {"id": 4, "name": "Broken Test API", "url": "https://this-does-not-exist-12345.com"},
]

def check_service(service):
    start = time.time()
    try:
        response = requests.get(service["url"], timeout=5)
        response_time_ms = round((time.time() - start) * 1000)
        status = "up" if response.status_code < 400 else "down"
        status_code = response.status_code
    except requests.exceptions.RequestException:
        response_time_ms = round((time.time() - start) * 1000)
        status = "down"
        status_code = None

    result = {
        "id": service["id"],
        "name": service["name"],
        "url": service["url"],
        "status": status,
        "status_code": status_code,
        "response_time_ms": response_time_ms
    }

    save_check(result)

    if status == "down":
        save_alert(result)

    return result

def save_check(result):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO checks (service_id, service_name, status, status_code, response_time_ms)
        VALUES (%s, %s, %s, %s, %s)
    """, (result["id"], result["name"], result["status"], result["status_code"], result["response_time_ms"]))
    conn.commit()
    cursor.close()
    conn.close()

def save_alert(result):
    conn = get_connection()
    cursor = conn.cursor()
    message = f"{result['name']} is down (status code: {result['status_code']})"
    cursor.execute("""
        INSERT INTO alerts (service_id, service_name, message)
        VALUES (%s, %s, %s)
    """, (result["id"], result["name"], message))
    conn.commit()
    cursor.close()
    conn.close()

def check_all_services():
    return [check_service(s) for s in MONITORED_SERVICES]