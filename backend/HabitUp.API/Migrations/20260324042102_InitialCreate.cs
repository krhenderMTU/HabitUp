using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HabitUp.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ToDoItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Completed = table.Column<bool>(type: "INTEGER", nullable: false),
                    DateStarted = table.Column<int>(type: "INTEGER", nullable: false),
                    DateCompleted = table.Column<int>(type: "INTEGER", nullable: true),
                    TimesCompleted = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletionInterval = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ToDoItems", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ToDoItems");
        }
    }
}
