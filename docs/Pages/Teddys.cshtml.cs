using Microsoft.AspNetCore.Mvc.RazorPages;
using System.IO;

namespace BeauSlushWebsite.Pages;

public class TeddysModel : PageModel
{
    public List<string> TeddyImages { get; private set; } = new();
    public List<string> BackgroundImages { get; private set; } = new();

    public void OnGet()
    {
        var contentRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "TeddysStuff");
        var teddyFolder = Path.Combine(contentRoot, "");
        var backgroundsFolder = Path.Combine(contentRoot, "Backgrounds");

        TeddyImages = Directory
            .GetFiles(teddyFolder, "*.png")
            .Concat(Directory.GetFiles(teddyFolder, "*.jpg"))
            .Concat(Directory.GetFiles(teddyFolder, "*.jpeg"))
            .Where(path => !path.Contains("Backgrounds", StringComparison.OrdinalIgnoreCase))
            .Select(path => "/images/TeddysStuff/" + Path.GetFileName(path))
            .OrderBy(path => path)
            .ToList();

        BackgroundImages = Directory
            .GetFiles(backgroundsFolder, "*.png")
            .Concat(Directory.GetFiles(backgroundsFolder, "*.jpg"))
            .Concat(Directory.GetFiles(backgroundsFolder, "*.jpeg"))
            .Select(path => "/images/TeddysStuff/Backgrounds/" + Path.GetFileName(path))
            .OrderBy(path => path)
            .ToList();
    }
}
