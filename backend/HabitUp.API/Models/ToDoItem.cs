using System.ComponentModel.DataAnnotations;

namespace HabitUp.Models;

public class ToDoItem
{
    [Key]
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool Completed { get; set; }

    public int DateStarted { get; set; }

    public int? DateCompleted { get; set; }

    public int TimesCompleted { get; set; }

    public int? CompletionInterval { get; set; }
}