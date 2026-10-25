
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const message = document.getElementById("message");

// Display all tasks
async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
            throw new Error("Unable to load tasks");
        }

        const tasks = await response.json();
        taskList.replaceChildren();

        if (tasks.length === 0) {
            taskList.textContent =
                "No tasks yet. Add your first task!";
            return;
        }

        tasks.forEach(task => {
            const card = document.createElement("div");
            card.className = "task-card";

            const title = document.createElement("h3");
            title.textContent = task.title;

            const subject = document.createElement("p");
            subject.textContent =
                "Subject: " + (task.subject || "Not specified");

            const dueDate = document.createElement("p");
            dueDate.textContent =
                "Due date: " + (task.due_date || "Not specified");

            const status = document.createElement("span");
            status.className = "status";
            status.textContent = task.status || "Pending";

            // Complete / Pending button
            const statusButton = document.createElement("button");
            statusButton.type = "button";
            statusButton.className = "status-button";
            statusButton.textContent =
                task.status === "Completed"
                    ? "Mark Pending"
                    : "Mark Completed";

            statusButton.addEventListener("click", async () => {
                const newStatus =
                    task.status === "Completed"
                        ? "Pending"
                        : "Completed";

                try {
                    const response = await fetch(
                        `/api/tasks/${task.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                status: newStatus
                            })
                        }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.error || "Unable to update task"
                        );
                    }

                    message.textContent =
                        "Task status updated successfully!";
                    await loadTasks();
                } catch (error) {
                    message.textContent = error.message;
                }
            });

            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-button";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", async () => {
                if (!confirm(`Delete "${task.title}"?`)) {
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/tasks/${task.id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.error || "Unable to delete task"
                        );
                    }

                    message.textContent = "Task deleted successfully!";
                    await loadTasks();
                } catch (error) {
                    message.textContent = error.message;
                }
            });

            card.append(
                title,
                subject,
                dueDate,
                status,
                statusButton,
                deleteButton
            );

            taskList.appendChild(card);
        });
    } catch (error) {
        taskList.textContent =
            "Could not load tasks. Check whether Flask is running.";
    }
}

// Add a new task
taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const task = {
        title: document.getElementById("title").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        due_date: document.getElementById("due_date").value
    };

    if (!task.title) {
        message.textContent = "Please enter a task title.";
        return;
    }

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(task)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Unable to add task"
            );
        }

        message.textContent = "Task added successfully!";
        taskForm.reset();
        await loadTasks();
    } catch (error) {
        message.textContent = error.message;
    }
});

// Load tasks when the page opens
loadTasks();
