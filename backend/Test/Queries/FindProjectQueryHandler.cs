using AppService.API.Contracts;
using AppService.API.Models;
using AppService.API.Services;
using ErrorOr;
using MediatR;
using Supabase;

namespace AppService.API.Queries;

public sealed record FindProjectQuery(string UserId, Guid ProjectId) : IRequest<ErrorOr<ProjectResponseModel>>;

internal sealed class FindProjectQueryHandler : IRequestHandler<FindProjectQuery, ErrorOr<ProjectResponseModel>>
{
    private readonly ILogger<FindProjectQueryHandler> _logger;
    private readonly Client _supabase;
    private readonly IBlobStorageService _blobStorageService;

    public FindProjectQueryHandler(ILogger<FindProjectQueryHandler> logger, Client supabase, IBlobStorageService blobStorageService)
    {
        _logger = logger;
        _supabase = supabase;
        _blobStorageService = blobStorageService;
    }

    public async Task<ErrorOr<ProjectResponseModel>> Handle(FindProjectQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var db = await _supabase.From<ProjectModel>().Where(x => x.UserId == request.UserId && x.Id == request.ProjectId).Get(cancellationToken);
            var project = db.Models.FirstOrDefault();
            if (project is null) return Error.NotFound(description: "Project not found.");

            var transcription = _blobStorageService.GetBlobSasUri(project.TranscriptionFileName);
            var audio = _blobStorageService.GetBlobSasUri(project.AudioFileName);

            return new ProjectResponseModel
            {
                Id = project.Id,
                UserId = project.UserId,
                Name = project.Name,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                AudioFileUrl = audio,
                TranscriptionFileUrl = transcription,
                Duration = project.Duration
            };
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex, ex.Message);
            return Error.Failure(description: "Failed to find project.");
        }
    }
}
