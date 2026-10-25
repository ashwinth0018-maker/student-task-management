
from flask import Flask, jsonify, request, render_template
import sqlite3

app = Flask(__name__)

DATABASE = "tasks.db"


# Connect to SQLite database
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# Create the tasks table
def create_table():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subject TEXT,
            due_date TEXT,
            status TEXT DEFAULT 'Pending'
        )
    """)

    conn.commit()
    conn.close()


# Display the frontend page
@app.route("/")
def home():
    return render_template("index.html")


# Get all tasks
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    conn = get_db_connection()

    tasks = conn.execute(
        "SELECT * FROM tasks ORDER BY id DESC"
    ).fetchall()

    conn.close()

    return jsonify([dict(task) for task in tasks])


# Add a new task
@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True)

    if not data or not data.get("title", "").strip():
        return jsonify({
            "error": "Task title is required"
        }), 400

    title = data["title"].strip()
    subject = data.get("subject", "").strip()
    due_date = data.get("due_date", "")

    conn = get_db_connection()

    cursor = conn.execute("""
        INSERT INTO tasks (title, subject, due_date)
        VALUES (?, ?, ?)
    """, (title, subject, due_date))

    conn.commit()
    task_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "message": "Task added successfully",
        "id": task_id
    }), 201


# Mark a task as completed or pending
@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(silent=True)

    if not data or data.get("status") not in ["Pending", "Completed"]:
        return jsonify({
            "error": "Status must be Pending or Completed"
        }), 400

    conn = get_db_connection()

    cursor = conn.execute("""
        UPDATE tasks
        SET status = ?
        WHERE id = ?
    """, (data["status"], task_id))

    conn.commit()
    updated = cursor.rowcount

    conn.close()

    if updated == 0:
        return jsonify({
            "error": "Task not found"
        }), 404

    return jsonify({
        "message": "Task status updated successfully"
    })


# Delete a task
@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_db_connection()

    cursor = conn.execute(
        "DELETE FROM tasks WHERE id = ?",
        (task_id,)
    )

    conn.commit()
    deleted = cursor.rowcount

    conn.close()

    if deleted == 0:
        return jsonify({
            "error": "Task not found"
        }), 404

    return jsonify({
        "message": "Task deleted successfully"
    })


# Start the application
if __name__ == "__main__":
    create_table()
    app.run(debug=True)
