using AppService.API.Commands;
using AppService.API.Contracts;
using AppService.API.Queries;
using ErrorOr;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace AppService.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ProjectsController(ISender sender) : ApiControllerBase
{
    private readonly ISender _sender = sender;

    [HttpPost]
    [Route("create")]
    public async Task<IActionResult> CreateProjectAsync([FromHeader(Name = "USER-ID"), Required] string userId, [FromForm, Required] CreateProjectRequest request)
    {
        const long maxFileSize = 50 * 1024 * 1024; // 50 MB
        if (request.AudioFile.Length > maxFileSize)
        {
            ErrorOr<string> result = Error.Conflict(description: "File size is too large");
            return result.Match(Ok, Problem);
        }

        if (!request.AudioFile.ContentType.StartsWith("audio/"))
        {
            ErrorOr<string> result = Error.Conflict(description: "File is not an audio file");
            return result.Match(Ok, Problem);
        }

        var project = await _sender.Send(new CreateProjectCommand(userId, request.Name, request.AudioFile));
        return project.Match(Ok, Problem);
    }

    [HttpGet]
    [Route("{projectId}")]
    public async Task<IActionResult> FindProjectAsync([FromHeader(Name = "USER-ID"), Required] string userId, [FromRoute, Required] Guid projectId)
    {
        var project = await _sender.Send(new FindProjectQuery(userId, projectId));
        return project.Match(Ok, Problem);
    }

    [HttpGet]
    [Route("list")]
    public async Task<IActionResult> ListProjectsAsync([FromHeader(Name = "USER-ID"), Required] string userId)
    {
        var projects = await _sender.Send(new ListProjectsQuery(userId));
        return projects.Match(Ok, Problem);
    }

    [HttpPatch]
    [Route("{projectId}")]
    public async Task<IActionResult> RenameProjectAsync([FromHeader(Name = "USER-ID"), Required] string userId, [FromRoute, Required] Guid projectId, [FromBody, Required] RenameProjectRequest request)
    {
        var project = await _sender.Send(new RenameProjectCommand(userId, projectId, request.Name));
        return project.Match(Ok, Problem);
    }

    [HttpDelete]
    [Route("{projectId}")]
    public async Task<IActionResult> DeleteProjectAsync([FromHeader(Name = "USER-ID"), Required] string userId, [FromRoute, Required] Guid projectId)
    {
        var project = await _sender.Send(new DeleteProjectCommand(userId, projectId));
        return project.Match(_ => NoContent(), Problem);
    }
}
