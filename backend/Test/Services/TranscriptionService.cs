using ErrorOr;
using System.Net.Http.Headers;
using System.Text.Json;

namespace AppService.API.Services;

public interface ITranscriptionService
{
    Task<ErrorOr<TranscriptionResponse>> TranscribeAsync(Stream audioStream, string contentType);
}

public class TranscriptionService : ITranscriptionService
{
    private readonly ILogger<TranscriptionService> _logger;
    private readonly IHttpClientFactory _factory;

    public TranscriptionService(ILogger<TranscriptionService> logger, IHttpClientFactory factory)
    {
        _logger = logger;
        _factory = factory;
    }

    public async Task<ErrorOr<TranscriptionResponse>> TranscribeAsync(Stream audioStream, string contentType)
    {
        if (audioStream == null || !audioStream.CanRead)
        {
            _logger.LogError("Invalid audio stream provided.");
            return Error.Failure(description: "Invalid audio stream.");
        }

        var client = _factory.CreateClient("deepgram_service");


        var content = new StreamContent(audioStream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        try
        {
            var requestUri = "v1/listen?summarize=v2&smart_format=true&punctuate=true&paragraphs=true&language=en&model=nova-2";
            var response = await client.PostAsync(requestUri, content);
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();

            var deepgramResponse = JsonSerializer.Deserialize<DeepgramResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (deepgramResponse?.Results?.Channels == null || deepgramResponse.Results.Channels.Length == 0)
            {
                return Error.Failure(description: "Failed to transcribe the audio file.");
            }

            var channel = deepgramResponse.Results.Channels[0];
            var alternative = channel.Alternatives.FirstOrDefault();

            if (alternative == null)
            {
                return Error.Failure(description: "No transcription alternatives found in Deepgram response.");
            }

            var transcript = alternative.Transcript;
            var summary = deepgramResponse.Results.Summary?.Short ?? "No summary available.";

            var paragraphs = alternative.Paragraphs.Paragraphs.Select(p => new ParagraphResponse
            {
                Sentences = p.Sentences.Select(s => new SentenceResponse
                {
                    Text = s.Text,
                    Start = s.Start,
                    End = s.End
                }).ToList(),
            }).ToList();

            return new TranscriptionResponse
            {
                Transcription = transcript,
                Summary = summary,
                Paragraphs = paragraphs
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred during transcription.");
            return Error.Failure(description: "An unexpected error occurred during transcription.");
        }
    }

    // Classes to represent Deepgram's JSON response
    private class DeepgramResponse
    {
        public Results Results { get; set; }
    }

    private class Results
    {
        public Channel[] Channels { get; set; }
        public Summary Summary { get; set; }
    }

    private class Channel
    {
        public Alternative[] Alternatives { get; set; }
    }

    private class Alternative
    {
        public string Transcript { get; set; }
        public double Confidence { get; set; }
        public Word[] Words { get; set; }
        public ParagraphData Paragraphs { get; set; }
    }

    private class Word
    {
        public string WordText { get; set; }
        public double Start { get; set; }
        public double End { get; set; }
        public double Confidence { get; set; }
        public string Punctuated_word { get; set; }
    }

    private class ParagraphData
    {
        public string Transcript { get; set; }
        public Paragraph[] Paragraphs { get; set; }
    }

    private class Paragraph
    {
        public Sentence[] Sentences { get; set; }
    }

    private class Sentence
    {
        public string Text { get; set; }
        public double Start { get; set; }
        public double End { get; set; }
    }

    private class Summary
    {
        public string Result { get; set; }
        public string Short { get; set; }
    }
}

public class TranscriptionResponse
{
    public string Transcription { get; set; }
    public string Summary { get; set; }
    public List<ParagraphResponse> Paragraphs { get; set; }
}

public class ParagraphResponse
{
    public List<SentenceResponse> Sentences { get; set; }
}

public class SentenceResponse
{
    public string Text { get; set; }
    public double Start { get; set; }
    public double End { get; set; }
}