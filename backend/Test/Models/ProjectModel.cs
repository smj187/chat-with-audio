using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace AppService.API.Models;

[Table("projects")]
public class ProjectModel : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("user_id")]
    public string UserId { get; set; }

    [Column("name")]
    public string Name { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}
