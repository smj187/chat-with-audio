using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Azure.Storage;

namespace AppService.API.Services;

public interface IBlobStorageService
{
    Task<string> UploadStreamAsync(string blobName, Stream content, string contentType, IDictionary<string, string> metadata);
    Task DeleteBlobAsync(string blobName);
    string GetBlobSasUri(string blobName);
}

public class BlobStorageService : IBlobStorageService
{
    private readonly string _connectionString;
    private readonly string _accountName;
    private readonly string _accountKey;
    private readonly string _containerName;

    public BlobStorageService(IConfiguration configuration)
    {
        _connectionString = configuration.GetValue<string>("Azure_BlobStorage_ConnectionString")
                            ?? throw new ArgumentException("Azure_BlobStorage_ConnectionString configuration is missing.");

        _accountName = configuration.GetValue<string>("Azure_BlobStorage_AccountName")
                       ?? throw new ArgumentException("Azure_BlobStorage_AccountName configuration is missing.");

        _accountKey = configuration.GetValue<string>("Azure_BlobStorage_AccountKey")
                      ?? throw new ArgumentException("Azure_BlobStorage_AccountKey configuration is missing.");

        _containerName = configuration.GetValue<string>("Azure_BlobStorage_ContainerName")
                         ?? throw new ArgumentException("Azure_BlobStorage_ContainerName configuration is missing.");
    }


    public async Task DeleteBlobAsync(string blobName)
    {
        var blobContainerClient = new BlobContainerClient(_connectionString, _containerName);
        var blobClient = blobContainerClient.GetBlobClient(blobName);

        await blobClient.DeleteIfExistsAsync();
    }

    public string GetBlobSasUri(string blobName)
    {
        var blobServiceClient = new BlobServiceClient(_connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobName);

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _containerName,
            BlobName = blobName,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-15),
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(60),
            Protocol = SasProtocol.Https
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);


        var sasToken = sasBuilder.ToSasQueryParameters(new StorageSharedKeyCredential(_accountName, _accountKey));
        var blobUriBuilder = new BlobUriBuilder(blobClient.Uri)
        {
            Sas = sasToken
        };
        return blobUriBuilder.ToUri().ToString();
    }

    public async Task<string> UploadStreamAsync(string blobName, Stream content, string contentType, IDictionary<string, string> metadata)
    {
        var blobContainerClient = new BlobContainerClient(_connectionString, _containerName);
        var blobClient = blobContainerClient.GetBlobClient(blobName);

        await blobClient.UploadAsync(content, overwrite: true);

        var blobHttpHeaders = new BlobHttpHeaders
        {
            ContentType = contentType,

        };

        await blobClient.SetHttpHeadersAsync(blobHttpHeaders);
        await blobClient.SetTagsAsync(metadata);

        return GetBlobSasUri(blobName);
    }
}
