using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Text.RegularExpressions;

[IgnoreAntiforgeryToken]
public class BeaBobModel : PageModel
{
    [BindProperty]
    public string Input { get; set; } = string.Empty;

    public async Task<IActionResult> OnPostAskAsync([FromBody] AskRequest req)
    {
        try
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Input))
                return new JsonResult(new { answer = "I need more clear keywords to give a direct answer." });

            // If an external LLM key is provided, try using it for higher-quality replies.
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? Environment.GetEnvironmentVariable("OPENAIKEY");
            var model = Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? "gpt-4o-mini";

            if (!string.IsNullOrEmpty(apiKey))
            {
                try
                {
                    var remote = await QueryOpenAiAsync(apiKey, model, req.Input);
                    if (!string.IsNullOrWhiteSpace(remote))
                        return new JsonResult(new { answer = remote });
                }
                catch
                {
                    // if remote call fails, fall back to local engine
                }
            }

            var ai = new Beabob();
            var answer = ai.Generate(req.Input);
            return new JsonResult(new { answer = answer });
        }
        catch (System.Exception ex)
        {
            return new JsonResult(new { answer = "Error: " + ex.Message });
        }
    }

    private async Task<string> QueryOpenAiAsync(string apiKey, string model, string input)
    {
        using var client = new System.Net.Http.HttpClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("BeaBob/1.0");

        var endpoint = Environment.GetEnvironmentVariable("OPENAI_API_URL") ?? "https://api.openai.com/v1/chat/completions";

        var payload = new
        {
            model = model,
            messages = new[] {
                new { role = "system", content = "You are BeaBob, a friendly assistant that answers concisely and helpfully." },
                new { role = "user", content = input }
            },
            max_tokens = 400,
            temperature = 0.7
        };

        var content = new System.Net.Http.StringContent(System.Text.Json.JsonSerializer.Serialize(payload));
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

        var resp = await client.PostAsync(endpoint, content);
        resp.EnsureSuccessStatusCode();

        var body = await resp.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(body);
        // Try to extract chat completion text (OpenAI-compatible)
        if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
        {
            var first = choices[0];
            if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentEl))
            {
                return contentEl.GetString() ?? string.Empty;
            }
            if (first.TryGetProperty("text", out var textEl))
            {
                return textEl.GetString() ?? string.Empty;
            }
        }

        return string.Empty;
    }

    public class AskRequest
    {
        public string Input { get; set; } = string.Empty;
    }
}
