using AppService.API.Contracts;
using AppService.API.Models;
using AppService.API.Services;
using ErrorOr;
using MediatR;
using Newtonsoft.Json;
using Supabase;
using System.Text;

namespace AppService.API.Commands;

public sealed record AskCommand(string Question, string UserId, Guid ProjectId) : IRequest<ErrorOr<AskResponseModel>>;

internal sealed class AskCommandHandler : IRequestHandler<AskCommand, ErrorOr<AskResponseModel>>
{
    private readonly IHttpClientFactory _factory;
    private readonly ILogger<AskCommandHandler> _logger;
    private readonly IBlobStorageService _blobStorageService;
    private readonly Client _supabase;

    public AskCommandHandler(IHttpClientFactory factory, ILogger<AskCommandHandler> logger, IBlobStorageService blobStorageService, Supabase.Client supabase)
    {
        _factory = factory;
        _logger = logger;
        _blobStorageService = blobStorageService;
        _supabase = supabase;
    }

    public async Task<ErrorOr<AskResponseModel>> Handle(AskCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var db = await _supabase.From<ProjectModel>().Where(x => x.UserId == request.UserId && x.Id == request.ProjectId).Get(cancellationToken);
            var project = db.Models.FirstOrDefault();
            if (project is null) return Error.NotFound(description: "Project not found.");

            var uri = _blobStorageService.GetBlobSasUri(project.TranscriptionFileName);
            var body = new
            {
                question = request.Question,
                url = uri,
                project_id = project.Id.ToString(),
            };
            var jsonBody = JsonConvert.SerializeObject(body);
            var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

            // Send the POST request
            var client = _factory.CreateClient("cognitive_service");
            var response = await client.PostAsync("ask", content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Failed to send transcription to cognitive service: {response.StatusCode}");
                return Error.Failure(description: "Failed to send transcription to cognitive service.");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var askResponse = JsonConvert.DeserializeObject<AskResponseModel>(responseContent);
            return askResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to ask question");
            return Error.Failure(description: "failed to ask question");
        }
    }
}
