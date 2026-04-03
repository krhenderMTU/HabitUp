using Microsoft.AspNetCore.Mvc;
using HabitUp.Services;

namespace HabitUp.Controllers;

[ApiController]
[Route("tasks")]
public class ToDoController(IToDoService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Models.ToDoItem>>> GetAll()
    {
        var items = await service.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Models.ToDoItem>> Get(int id)
    {
        var item = await service.GetAsync(id);
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Models.ToDoItem todoItem)
    {
        await service.SaveAsync(todoItem);
        return CreatedAtAction(nameof(Get), new { id = todoItem.Id }, todoItem);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Models.ToDoItem todoItem)
    {
        todoItem.Id = id;
        await service.SaveAsync(todoItem);
        return Ok(todoItem);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await service.DeleteAsync(id);
        return NoContent();
    }
}