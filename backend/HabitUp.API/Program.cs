using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// In-memory task store (replace with a real DB later)
var taskStore = new List<TaskRecord>();
var nextId = 1;

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngular");

// ── GET /tasks ───────────────────────────────────────────────────────────────
app.MapGet("/tasks", () =>
{
    return Results.Ok(taskStore);
})
.WithName("GetTasks");

// ── GET /tasks/{id} ──────────────────────────────────────────────────────────
app.MapGet("/tasks/{id}", (int id) =>
{
    var task = taskStore.FirstOrDefault(t => t.Id == id);
    return task is not null ? Results.Ok(task) : Results.NotFound();
})
.WithName("GetTask");

// ── POST /tasks ──────────────────────────────────────────────────────────────
app.MapPost("/tasks", (CreateTaskRequest request) =>
{
    var task = new TaskRecord(
        Id: nextId++,
        Title: request.Title,
        Description: request.Description,
        Completed: request.Completed,
        DateStarted: request.DateStarted,
        DateCompleted: request.DateCompleted,
        TimesCompleted: request.TimesCompleted,
        CompletionInterval: request.CompletionInterval
    );
    taskStore.Add(task);
    return Results.Created($"/tasks/{task.Id}", task);
})
.WithName("CreateTask");

// ── PUT /tasks/{id} ──────────────────────────────────────────────────────────
app.MapPut("/tasks/{id}", (int id, CreateTaskRequest request) =>
{
    var index = taskStore.FindIndex(t => t.Id == id);
    if (index == -1) return Results.NotFound();

    taskStore[index] = new TaskRecord(
        Id: id,
        Title: request.Title,
        Description: request.Description,
        Completed: request.Completed,
        DateStarted: request.DateStarted,
        DateCompleted: request.DateCompleted,
        TimesCompleted: request.TimesCompleted,
        CompletionInterval: request.CompletionInterval
    );
    return Results.Ok(taskStore[index]);
})
.WithName("UpdateTask");

// ── DELETE /tasks/{id} ───────────────────────────────────────────────────────
app.MapDelete("/tasks/{id}", (int id) =>
{
    var task = taskStore.FirstOrDefault(t => t.Id == id);
    if (task is null) return Results.NotFound();

    taskStore.Remove(task);
    return Results.NoContent();
})
.WithName("DeleteTask");

app.Run();

// ── Models ───────────────────────────────────────────────────────────────────

record TaskRecord(
    int Id,
    string Title,
    string Description,
    bool Completed,
    int DateStarted,
    int? DateCompleted,
    int TimesCompleted,
    int? CompletionInterval
);

record CreateTaskRequest(
    string Title,
    string Description,
    bool Completed,
    int DateStarted,
    int? DateCompleted,
    int TimesCompleted,
    int? CompletionInterval
);
