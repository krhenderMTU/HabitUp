using HabitUp.Models;
using Microsoft.EntityFrameworkCore;

namespace HabitUp.Data;

public class HabitUpDbContext(DbContextOptions<HabitUpDbContext> options) : DbContext(options)
{
    public DbSet<ToDoItem> ToDoItems => Set<ToDoItem>();
}
