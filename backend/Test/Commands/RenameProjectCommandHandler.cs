using AppService.API.Contracts;
using AppService.API.Models;
using ErrorOr;
using MediatR;
using Supabase;

namespace AppService.API.Commands;

public sealed record RenameProjectCommand(string UserId, Guid ProjectId, string NewName) : IRequest<ErrorOr<ProjectResponseModel>>;

internal sealed class RenameProjectCommandHandler : IRequestHandler<RenameProjectCommand, ErrorOr<ProjectResponseModel>>
{
    private readonly ILogger<RenameProjectCommandHandler> _logger;
    private readonly Client _supabase;

    public RenameProjectCommandHandler(ILogger<RenameProjectCommandHandler> logger, Client supabase)
    {
        _logger = logger;
        _supabase = supabase;
    }

    public async Task<ErrorOr<ProjectResponseModel>> Handle(RenameProjectCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var db = await _supabase.From<ProjectModel>().Where(x => x.UserId == request.UserId && x.Id == request.ProjectId).Get(cancellationToken);
            var project = db.Models.FirstOrDefault();
            if (project is null) return Error.NotFound(description: "Project not found.");

            project.Name = request.NewName;
            project.UpdatedAt = DateTime.UtcNow;

            var updated = await _supabase.From<ProjectModel>().Update(project);
            var updatedProject = updated.Models.First();

            return new ProjectResponseModel
            {
                Id = updatedProject.Id,
                UserId = updatedProject.UserId,
                Name = updatedProject.Name,
                CreatedAt = updatedProject.CreatedAt,
                UpdatedAt = updatedProject.UpdatedAt,
            };
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex, ex.Message);
            return Error.Failure(description: "Failed to rename project.");
        }
    }
}
