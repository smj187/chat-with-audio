using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;

namespace AppService.API.Extensions;

public class SnakeCaseModelBinderProvider : IModelBinderProvider
{
    public IModelBinder GetBinder(ModelBinderProviderContext context)
    {
        if (context == null)
            throw new ArgumentNullException(nameof(context));

        if (context.BindingInfo.BindingSource == BindingSource.Form && context.Metadata.IsComplexType && !context.Metadata.IsCollectionType)
        {
            return new BinderTypeModelBinder(typeof(SnakeCaseModelBinder));
        }

        return null;
    }
}
