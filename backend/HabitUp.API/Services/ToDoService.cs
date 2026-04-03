using HabitUp.Data;
using Microsoft.EntityFrameworkCore;

namespace HabitUp.Services;

public class ToDoService(HabitUpDbContext db) : IToDoService
{
    public async Task SaveAsync(Models.ToDoItem item)
    {
        var existing = await db.ToDoItems.FindAsync(item.Id);
        if (existing == null)
            db.ToDoItems.Add(item);
        else
            db.Entry(existing).CurrentValues.SetValues(item);
        await db.SaveChangesAsync();
    }

    public Task<Models.ToDoItem> GetAsync(int id) =>
        db.ToDoItems.FindAsync(id).AsTask()!;

    public Task<List<Models.ToDoItem>> GetAllAsync() =>
        db.ToDoItems.ToListAsync();

    public async Task DeleteAsync(int id)
    {
        var item = await db.ToDoItems.FindAsync(id);
        if (item != null)
        {
            db.ToDoItems.Remove(item);
            await db.SaveChangesAsync();
        }
    }
}  