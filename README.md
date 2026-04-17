# ⚡ HabitUp

A habit and task tracking application with an Angular frontend and a .NET backend using SQLite for persistent storage.

---

## Prerequisites

Before setting up the project, make sure the following are installed:

| Tool | Download |
|---|---|
| [Node.js (LTS)](https://nodejs.org) | Required for Angular |
| [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0) | Required for the backend |
| [Angular CLI](https://angular.dev/tools/cli) | `npm install -g @angular/cli` |
| [EF Core CLI Tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet) | `dotnet tool install --global dotnet-ef` |

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/HabitUp.git
cd HabitUp
```

### 2. Set up the backend

```bash
cd backend/HabitUp.API
dotnet restore
dotnet ef database update
```

`dotnet ef database update` creates the `habitup.db` SQLite database file and applies the schema. This only needs to be run once.

### 3. Set up the frontend

```bash
cd frontend/HabitUp-UI
npm install
```

---

## Running the App

Both the backend and frontend need to be running at the same time. Open two terminals.

**Terminal 1 — Backend:**
```bash
cd backend/HabitUp.API
dotnet run
```
The API will be available at `http://localhost:5245`. You can explore the endpoints at `http://localhost:5245/swagger`.

**Terminal 2 — Frontend:**
```bash
cd frontend/HabitUp-UI
ng serve --proxy-config proxy.conf.json
```
Open your browser to `http://localhost:4200`.

---

## Using the App

### Creating a task
Click **+ Create Task** in the top right. Fill in the title (required, max 50 characters), an optional description (max 200 characters), a start date, and an optional completion interval in days (e.g. 7 for weekly, 30 for monthly). Leave the interval blank for one-time tasks.

### Completing a task
Click the **checkbox in the top left of a task card** to mark it complete for the day. Clicking it again the same day will undo the completion. Clicking it on a different day will not undo previous completions.

### Auto-reset
Tasks with a completion interval are automatically unchecked once the interval has passed, so they are ready to be completed again.

### Editing and deleting
Use the **Edit** and **Delete** buttons on each card. Deletion requires a confirmation step.

### Stats
Click **View Stats** on any task to see how many times it has been completed and your completion rate. Multiple stats panels can be open at the same time.

### Year View (Contribution Calendar)
Click **📅 Year View** in the header to show a GitHub-style heatmap of your task completion for the year so far. Each square represents one day, colored by how many of your active tasks were completed that day:

| Color | Completion |
|---|---|
| Dark background | 0% |
| Light green | 1–24% |
| Medium-light green | 25–49% |
| Green | 50–74% |
| Dark green | 75–100% |

Hover over any square to see the exact date and completion count. Today's square is outlined in gold. Note that each task stores only its most recent completion date, so the calendar is most accurate for today and recent days.

### Reminders
Click **🔔 Set Reminder** in the header to set a daily reminder time. If you have any incomplete tasks at that time, a popup will appear to prompt you to finish them. The reminder repeats every day at the set time until you clear it.

### Search
Type in the **search bar** to find a task by title. Select a result from the dropdown to jump to that task — it will move to the top of the list and briefly glow to show you where it is.

### Reordering
**Drag and drop** task cards to arrange them in any order you like.

---

## Project Structure

```
HabitUp/
├── backend/
│   └── HabitUp.API/        # .NET 10 Web API with SQLite
└── frontend/
    └── HabitUp-UI/         # Angular application
```
