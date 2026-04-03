using HabitUp.Models;

namespace HabitUp.Services;

public interface IToDoService 
{
    // Save a ToD0
    Task SaveAsync(Models.ToDoItem item);
    // Get a ToD0 by ID
    Task<Models.ToDoItem> GetAsync(int id);
    // Get all ToD0's
    Task<List<Models.ToDoItem>> GetAllAsync();
    // Delete a ToD0
    Task DeleteAsync(int id);
}