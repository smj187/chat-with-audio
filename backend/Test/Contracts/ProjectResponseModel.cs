namespace AppService.API.Contracts;

public class ProjectResponseModel
{
    public Guid Id { get; set; }
    public string UserId { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
