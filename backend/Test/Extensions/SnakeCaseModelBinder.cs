using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Reflection;
using System.Text;

namespace AppService.API.Extensions;

public class SnakeCaseModelBinder : IModelBinder
{
    private readonly ILogger<SnakeCaseModelBinder> _logger;

    public SnakeCaseModelBinder(ILogger<SnakeCaseModelBinder> logger)
    {
        _logger = logger;
    }

    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        if (bindingContext == null)
            throw new ArgumentNullException(nameof(bindingContext));

        _logger.LogInformation("Starting model binding for {ModelType}", bindingContext.ModelType.Name);

        if (bindingContext.BindingSource != BindingSource.Form)
        {
            _logger.LogWarning("Binding source is not Form. Binding failed.");
            bindingContext.Result = ModelBindingResult.Failed();
            return Task.CompletedTask;
        }

        if (!bindingContext.ModelMetadata.IsComplexType)
        {
            _logger.LogWarning("Model is not a complex type. Binding failed.");
            bindingContext.Result = ModelBindingResult.Failed();
            return Task.CompletedTask;
        }

        var model = Activator.CreateInstance(bindingContext.ModelType);

        foreach (var property in bindingContext.ModelType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (!property.CanWrite)
                continue;

            var snakeCaseName = ToSnakeCase(property.Name);
            _logger.LogInformation("Attempting to bind property {Property} from key {Key}", property.Name, snakeCaseName);

            if (typeof(IFormFile).IsAssignableFrom(property.PropertyType))
            {
                var file = bindingContext.HttpContext.Request.Form.Files.FirstOrDefault(f => f.Name == snakeCaseName);
                if (file != null)
                {
                    _logger.LogInformation("Found file for key {Key}: {FileName}", snakeCaseName, file.FileName);
                    property.SetValue(model, file);
                }
                continue;
            }
            else if (typeof(IEnumerable<IFormFile>).IsAssignableFrom(property.PropertyType))
            {
                var files = bindingContext.HttpContext.Request.Form.Files.Where(f => f.Name == snakeCaseName).ToList();
                if (files.Any())
                {
                    _logger.LogInformation("Found {Count} files for key {Key}", files.Count, snakeCaseName);
                    if (property.PropertyType.IsArray)
                    {
                        property.SetValue(model, files.ToArray());
                    }
                    else if (typeof(IList<IFormFile>).IsAssignableFrom(property.PropertyType))
                    {
                        var list = (IList<IFormFile>)Activator.CreateInstance(property.PropertyType);
                        foreach (var formFile in files)
                        {
                            list.Add(formFile);
                        }
                        property.SetValue(model, list);
                    }
                }
                continue;
            }

            var valueProviderResult = bindingContext.ValueProvider.GetValue(snakeCaseName);
            if (valueProviderResult != ValueProviderResult.None)
            {
                var value = valueProviderResult.FirstValue;
                _logger.LogInformation("Found value for key {Key}: {Value}", snakeCaseName, value);

                if (string.IsNullOrEmpty(value))
                    continue;

                Type targetType = Nullable.GetUnderlyingType(property.PropertyType) ?? property.PropertyType;
                object convertedValue = null;
                try
                {
                    if (targetType == typeof(string))
                    {
                        convertedValue = value;
                    }
                    else if (targetType.IsEnum)
                    {
                        convertedValue = Enum.Parse(targetType, value, true);
                    }
                    else
                    {
                        convertedValue = Convert.ChangeType(value, targetType, CultureInfo.InvariantCulture);
                    }
                    _logger.LogInformation("Converted value for {Property}: {ConvertedValue}", property.Name, convertedValue);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error converting value for {Property}: {Value}", property.Name, value);
                    bindingContext.ModelState.TryAddModelError(snakeCaseName, $"Invalid value for {snakeCaseName}.");
                    continue;
                }

                property.SetValue(model, convertedValue);
            }
            else
            {
                _logger.LogInformation("No value found for key {Key}", snakeCaseName);
            }
        }

        bindingContext.Result = ModelBindingResult.Success(model);
        _logger.LogInformation("Model binding successful for {ModelType}", bindingContext.ModelType.Name);
        return Task.CompletedTask;
    }

    private string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        var stringBuilder = new StringBuilder();
        for (int i = 0; i < input.Length; i++)
        {
            var c = input[i];
            if (char.IsUpper(c))
            {
                if (i > 0)
                    stringBuilder.Append('_');
                stringBuilder.Append(char.ToLower(c, CultureInfo.InvariantCulture));
            }
            else
            {
                stringBuilder.Append(c);
            }
        }
        return stringBuilder.ToString();
    }
}
