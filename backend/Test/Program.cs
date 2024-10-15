using AppService.API.Extensions;
using AppService.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Supabase;

var builder = WebApplication.CreateBuilder(args);

// route
builder.Services.Configure<RouteOptions>(opts => { opts.LowercaseUrls = true; });

// controllers
builder.Services.AddControllers(options =>
{
    options.ModelBinderProviders.Insert(0, new SnakeCaseModelBinderProvider());
})
.AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ContractResolver = new DefaultContractResolver
    {
        NamingStrategy = new SnakeCaseNamingStrategy()
    };
    options.SerializerSettings.Formatting = Formatting.Indented;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// cors
builder.Services.AddCors(options =>
{
    var origin = builder.Configuration.GetValue<string>("WebApp_AppEndpoint") ?? throw new ArgumentNullException("missing web app endpoint");
    options.AddPolicy("CORS",
        builder =>
        {
            builder.WithOrigins(origin)
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        });
});

// auth
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters.NameClaimType = "sub";
    });
builder.Services.AddAuthorization();


// database
var supabaseUrl = builder.Configuration.GetValue<string>("SUPABASE_URL") ?? throw new Exception("Missing configuration string");
var supabaseKey = builder.Configuration.GetValue<string>("SUPABASE_KEY") ?? throw new Exception("Missing configuration string");
var supabaseOptions = new SupabaseOptions
{
    AutoConnectRealtime = true
};
var supabaseClient = new Supabase.Client(supabaseUrl, supabaseKey, supabaseOptions);
await supabaseClient.InitializeAsync();
builder.Services.AddSingleton(supabaseClient);


// http clients
builder.Services.AddHttpClient("deepgram_service", config =>
{
    var baseUrl = builder.Configuration.GetValue<string>("Deepgram_BaseUrl") ?? throw new Exception("Missing configuration string");
    config.BaseAddress = new Uri(baseUrl);
    var apiKey = builder.Configuration.GetValue<string>("Deepgram_ApiKey") ?? throw new Exception("Missing configuration string");
    config.DefaultRequestHeaders.Add("Authorization", $"Token {apiKey}");
});
builder.Services.AddHttpClient("cognitive_service", config =>
{
    var baseUrl = builder.Configuration.GetValue<string>("CognitiveService_BaseUrl") ?? throw new Exception("Missing configuration string");
    config.BaseAddress = new Uri(baseUrl);
});

// services
builder.Services.AddSingleton<IBlobStorageService, BlobStorageService>();
builder.Services.AddSingleton<ITranscriptionService, TranscriptionService>();


// mediator
builder.Services.AddMediatR(config =>
{
    config.RegisterServicesFromAssemblies(typeof(Program).Assembly);
});

var app = builder.Build();
app.UseCors("CORS");
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();