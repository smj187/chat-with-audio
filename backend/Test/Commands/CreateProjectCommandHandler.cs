using AppService.API.Contracts;
using AppService.API.Models;
using AppService.API.Services;
using ErrorOr;
using MediatR;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Supabase;
using System.Text;

namespace AppService.API.Commands;

public sealed record CreateProjectCommand(string UserId, string Name, IFormFile AudioFile) : IRequest<ErrorOr<ProjectResponseModel>>;

internal sealed class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ErrorOr<ProjectResponseModel>>
{
    private readonly ILogger<CreateProjectCommandHandler> _logger;
    private readonly Client _supabase;
    private readonly IBlobStorageService _blobStorageService;
    private readonly ITranscriptionService _transcriptionService;

    public CreateProjectCommandHandler(ILogger<CreateProjectCommandHandler> logger, Client supabase, IBlobStorageService blobStorageService, ITranscriptionService transcriptionService)
    {
        _logger = logger;
        _supabase = supabase;
        _blobStorageService = blobStorageService;
        _transcriptionService = transcriptionService;
    }

    public async Task<ErrorOr<ProjectResponseModel>> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var newId = Guid.NewGuid();

            var audioBlobName = $"{request.UserId}/audio_{newId}{Path.GetExtension(request.AudioFile.FileName).ToLowerInvariant()}";
            var metadata = new Dictionary<string, string> { { "USER-ID", request.UserId.ToString() } };

            using var stream = new MemoryStream();
            await request.AudioFile.CopyToAsync(stream, cancellationToken);
            stream.Position = 0;



            var transcription = await _transcriptionService.TranscribeAsync(stream, request.AudioFile.ContentType);
            if (transcription.IsError)
            {
                return transcription.Errors;
            }
            var transcriptionBlobName = $"{request.UserId}/transcription_{newId}.json";
            var serializerSettings = new JsonSerializerSettings
            {
                ContractResolver = new LowercaseContractResolver(),
                Formatting = Formatting.Indented
            };
            var transcriptionJson = JsonConvert.SerializeObject(transcription.Value, serializerSettings);
            using var transcriptionStream = new MemoryStream(Encoding.UTF8.GetBytes(transcriptionJson));
            var transcriptionUploaded = await _blobStorageService.UploadStreamAsync(transcriptionBlobName, transcriptionStream, "application/json", metadata);
            Console.WriteLine(transcriptionUploaded.ToString());

            stream.Position = 0;
            var uploaded = await _blobStorageService.UploadStreamAsync(audioBlobName, stream, request.AudioFile.ContentType, metadata);

            Console.WriteLine(uploaded.ToString());

            var newProject = new ProjectModel
            {
                UserId = request.UserId,
                Name = request.Name,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
            };

            var db = await _supabase.From<ProjectModel>().Insert(newProject);
            var createdProject = db.Models.First();

            return new ProjectResponseModel
            {
                Id = createdProject.Id,
                UserId = createdProject.UserId,
                Name = createdProject.Name,
                CreatedAt = createdProject.CreatedAt,
                UpdatedAt = createdProject.UpdatedAt,
            };
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex, ex.Message);
            return Error.Failure(description: "Failed to create project.");
        }
    }

    private class LowercaseContractResolver : DefaultContractResolver
    {
        protected override string ResolvePropertyName(string propertyName)
        {
            return propertyName.ToLower();
        }
    }
}


