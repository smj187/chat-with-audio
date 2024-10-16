using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace AppService.API.Models;

[Table("projects")]
public class ProjectModel : BaseModel
{
    [PrimaryKey("id", true)]
    public Guid Id { get; set; }

    [Column("user_id")]
    public string UserId { get; set; }

    [Column("name")]
    public string Name { get; set; }

    [Column("audio_file_name")]
    public string AudioFileName { get; set; }

    [Column("transcription_file_name")]
    public string TranscriptionFileName { get; set; }
    [Column("duration")]
    public decimal Duration { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}
