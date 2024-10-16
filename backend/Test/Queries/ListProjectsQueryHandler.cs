using AppService.API.Contracts;
using AppService.API.Models;
using ErrorOr;
using MediatR;
using Supabase;

namespace AppService.API.Queries;

public sealed record ListProjectsQuery(string UserId) : IRequest<ErrorOr<List<ProjectResponseModel>>>;

internal sealed class ListProjectsQueryHandler : IRequestHandler<ListProjectsQuery, ErrorOr<List<ProjectResponseModel>>>
{
    private readonly ILogger<ListProjectsQueryHandler> _logger;
    private readonly Client _supabase;

    public ListProjectsQueryHandler(ILogger<ListProjectsQueryHandler> logger, Client supabase)
    {
        _logger = logger;
        _supabase = supabase;
    }

    public async Task<ErrorOr<List<ProjectResponseModel>>> Handle(ListProjectsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var db = await _supabase.From<ProjectModel>().Where(x => x.UserId == request.UserId).Get(cancellationToken);
            var projects = db.Models;

            return projects.Select(x => new ProjectResponseModel
            {
                Id = x.Id,
                UserId = x.UserId,
                Name = x.Name,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                Duration = x.Duration,
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogInformation(ex, ex.Message);
            return Error.Failure(description: "Failed to list projects.");
        }
    }
}
