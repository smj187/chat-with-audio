namespace AppService.API.Contracts;

public class CreateProjectRequest
{
    public IFormFile AudioFile { get; set; }
    public string Name { get; set; }
}
