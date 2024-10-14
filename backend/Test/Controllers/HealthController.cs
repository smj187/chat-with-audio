using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppService.API.Controllers;

[Authorize]
[ApiController]
[Route("/")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { Status = "Healthy" });
    }
}
