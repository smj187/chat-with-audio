namespace AppService.API.Contracts;

public class AskResponseModel
{
    public string Answer { get; set; }
    public List<AskMatchResponseModel> Matches { get; set; }
}

public class AskMatchResponseModel
{
    public decimal Score { get; set; }
    public decimal Start { get; set; }
    public decimal End { get; set; }
}