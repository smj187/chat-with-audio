using AppService.API.Models;
using ErrorOr;
using MediatR;
using Supabase;

namespace AppService.API.Commands;

public sealed record DeleteProjectCommand(string UserId, Guid ProjectId) : IRequest<ErrorOr<Unit>>;

internal sealed class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, ErrorOr<Unit>>
{
    private readonly ILogger<DeleteProjectCommandHandler> _logger;
    private readonly Client _supabase;

    public DeleteProjectCommandHandler(ILogger<DeleteProjectCommandHandler> logger, Client supabase)
    {
        _logger = logger;
        _supabase = supabase;
    }

    public async Task<ErrorOr<Unit>> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _supabase.From<ProjectModel>().Where(x => x.UserId == request.UserId && x.Id == request.ProjectId).Delete();
            return Unit.Value;
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex, ex.Message);
            return Error.Failure(description: "Failed to delete project.");
        }
    }
}
