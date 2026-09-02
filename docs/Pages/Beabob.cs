using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

public class Beabob
{
    private static readonly Random Random = new Random();

    private static readonly HashSet<string> Fillers = new(StringComparer.OrdinalIgnoreCase)
    {
        "the","is","and","a","to","of","in","it","that","this","for","on","with","as","at",
        "be","are","was","were","by","an","or","from","about","into","over","after","before",
        "between","through","during","without","dont","doesnt","didnt","would","could","should",
        "really","very","just","like","make","need","want","know","think","about","your","you",
        "we","our","them","their","they","themself","there","here","what","when","where","why",
        "how","who","which","while","then","than","also","too","but","because","have","has","had"
    };

    private static readonly Dictionary<string, string> SiteFacts = new(StringComparer.OrdinalIgnoreCase)
    {
        { "beauslush", "BeauSlush is a playful site full of tiny experiments, weird projects, and creative web toys." },
        { "beauslush.com", "BeauSlush.com is the home of the BeauSlush project, built as a fun little playground for experiments and mini-games." },
        { "beabob", "BeaBob is the site’s cheerful little assistant—friendly, quick, and meant to help with questions and ideas." },
        { "slush slam", "Slush Slam is a stacking game where you try to build a tower and keep it stable while dropping blocks in the right place." },
        { "teddys", "Teddys is a playful gallery/studio page where the site showcases teddy-themed visuals and custom scenes." },
        { "rng rng", "RNG RNG is the site’s luck-based mini-game where you roll random outcomes and collect rewards." },
        { "credits", "The credits page is the little thank-you section for the project and the people behind the silly ideas." },
        { "website", "This website is a creative collection of little experiments, games, and interactive fun built around the BeauSlush brand." },
        { "beau", "Beau is the name behind the BeauSlush vibe—creative, playful, and a bit chaotic in the best way." },
        { "slush", "Slush is the fun, goofy part of the BeauSlush identity: playful, weird, and a little unexpected." },
        { "game", "Games on this site are meant to be playful and experimental, not serious or overly complicated." },
        { "hello", "Hello! I’m BeaBob. Ask me anything and I’ll do my best to help." },
        { "hi", "Hi! I’m BeaBob. What do you want to explore?" },
        { "code", "Code is a set of instructions that tells a computer what to do, and this site is a mix of playful front-end experiments and small interactive features." },
        { "time", "I don’t have a clock built in, but your device does—if you need the exact time, check it there." },
        { "weather", "Weather depends on your location and the forecast, so the best answer usually comes from a local weather service." },
    };

    private static readonly Dictionary<string, string[]> TopicPatterns = new(StringComparer.OrdinalIgnoreCase)
    {
        { "how", new[] { "Start by breaking the problem into a few simple steps, then test each one before you try the full version.", "A practical way is to experiment a bit, adjust what doesn’t work, and keep the simplest version that solves the problem." } },
        { "why", new[] { "Because the real cause is usually a mix of context, conditions, and trade-offs rather than one single reason.", "Usually because the system is being shaped by multiple moving parts, not just one fixed rule." } },
        { "what", new[] { "It’s basically the main idea or thing you’re trying to understand, stripped down to the most useful meaning.", "In practical terms, it means the core concept or object behind the question, not just the surface details." } },
        { "who", new[] { "It usually refers to the person, group, or identity tied to the situation or project.", "It points to the creator, subject, or entity that matters most in the context." } },
        { "project", new[] { "A project is usually a focused idea or build that turns a creative concept into something usable and shareable.", "Think of it as a small creative system with a goal, a structure, and something to show for it." } },
        { "idea", new[] { "An idea becomes useful when it has a clear goal, a simple test, and a way to improve it over time.", "Good ideas often start messy, then get refined through small experiments and feedback." } }
    };

    private static readonly string[] Greetings =
    {
        "Hello!",
        "Hi there!",
        "Hey!",
        "Greetings!",
        "Howdy!"
    };

    private static readonly string[] Starters =
    {
        "The straightforward answer is that",
        "In simple terms,",
        "At its core,",
        "The main idea is that",
        "The practical answer is that",
        "Basically,",
        "The key point is that",
        "If I had to simplify it,"
    };

    private static readonly string[] FollowUps =
    {
        "That usually works best when you keep the goal clear and test things in small steps.",
        "A good next move is to focus on the simplest version first and improve it from there.",
        "The bigger picture is that context matters a lot, so the best answer depends on the situation.",
        "It helps to combine the core idea with a little experimentation so the result feels useful and natural.",
        "This is one of those ideas where a small amount of clarity makes a big difference.",
        "The answer gets stronger when you look at the actual goal instead of just the surface details."
    };

    private static readonly string[] Endings =
    {
        "That’s a pretty solid way to think about it.",
        "This is why the answer usually depends on context and goal.",
        "A simple version often makes the idea easier to apply.",
        "That’s the basic truth behind it.",
        "It’s a pretty useful frame to keep in mind.",
        "That makes the idea much easier to use in practice."
    };

    public string Generate(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return "Please say something and I’ll do my best to help.";

        var clean = input.Trim();

        if (IsGreeting(clean))
            return Pick(Greetings) + " What would you like to explore?";

        var keywords = ExtractKeywords(clean);
        if (keywords.Count == 0)
            return "I didn’t catch a clear topic—can you rephrase it with a keyword or a simple question?";

        var normalizedKeywords = NormalizeKeywords(keywords);
        var primaryTopic = SelectMainTopic(normalizedKeywords);

        if (TrySiteFact(primaryTopic, out var siteFact))
            return siteFact;

        var questionType = DetectQuestionType(clean);
        return BuildAnswer(primaryTopic, normalizedKeywords, questionType, clean);
    }

    private static bool IsGreeting(string input)
    {
        var lower = input.ToLowerInvariant();
        return lower.StartsWith("hi") || lower.StartsWith("hello") || lower.StartsWith("hey") || lower.StartsWith("yo") || lower.StartsWith("greetings") || lower.StartsWith("howdy");
    }

    private string BuildAnswer(string primaryTopic, List<string> keywords, string questionType, string originalInput)
    {
        var secondary = keywords.FirstOrDefault(k => !string.Equals(k, primaryTopic, StringComparison.OrdinalIgnoreCase)) ?? primaryTopic;
        var starter = Pick(Starters);

        if (questionType == "how")
        {
            return Capitalize(starter + " " + DescribeTopic(primaryTopic, secondary) + " " + Pick(FollowUps));
        }

        if (questionType == "why")
        {
            return Capitalize(starter + " " + ExplainCause(primaryTopic, secondary) + " " + Pick(FollowUps));
        }

        if (questionType == "what")
        {
            return Capitalize(starter + " " + DefineConcept(primaryTopic, secondary) + " " + Pick(Endings));
        }

        if (questionType == "advice")
        {
            return Capitalize(starter + " " + "A good approach is to keep the goal simple, test the first version quickly, and improve it step by step." + " " + Pick(Endings));
        }

        var baseAnswer = DescribeTopic(primaryTopic, secondary);
        var follow = Pick(FollowUps);
        var ending = Pick(Endings);

        if (originalInput.Length > 80 && Random.NextDouble() > 0.5)
        {
            return Capitalize(starter + " " + baseAnswer + " " + follow + " " + ending);
        }

        return Capitalize(starter + " " + baseAnswer + " " + follow + " " + ending);
    }

    private static string DescribeTopic(string primaryTopic, string secondary)
    {
        if (TopicPatterns.TryGetValue(primaryTopic, out var patterns) && patterns.Length > 0)
            return patterns[Random.Next(patterns.Length)];

        if (TopicPatterns.TryGetValue(secondary, out var altPatterns) && altPatterns.Length > 0)
            return altPatterns[Random.Next(altPatterns.Length)];

        return $"{TitleCase(primaryTopic)} is best understood as a practical concept that gains meaning when you look at the goal, context, and how it connects to surrounding ideas.";
    }

    private static string ExplainCause(string primaryTopic, string secondary)
    {
        return $"Because {TitleCase(primaryTopic)} usually depends on context, trade-offs, and how it interacts with other ideas rather than just one single rule.";
    }

    private static string DefineConcept(string primaryTopic, string secondary)
    {
        return $"{TitleCase(primaryTopic)} is essentially the main idea or object in focus, and it becomes clearer when you connect it to the larger purpose and surrounding context.";
    }

    private static bool TrySiteFact(string topic, out string answer)
    {
        answer = string.Empty;

        if (SiteFacts.TryGetValue(topic, out var value))
        {
            answer = value;
            return true;
        }

        var alias = topic switch
        {
            "slushs" => "slush",
            "slushslam" => "slush slam",
            "beabob" => "beabob",
            "teddys" => "teddys",
            "rng" => "rng rng",
            "game" => "game",
            _ => null
        };

        if (alias != null && SiteFacts.TryGetValue(alias, out var aliasValue))
        {
            answer = aliasValue;
            return true;
        }

        return false;
    }

    private static string DetectQuestionType(string text)
    {
        var lower = text.Trim();
        if (lower.StartsWith("who ") || lower.StartsWith("who's ")) return "who";
        if (lower.StartsWith("what ") || lower.StartsWith("what's ")) return "what";
        if (lower.StartsWith("when ")) return "when";
        if (lower.StartsWith("where ")) return "where";
        if (lower.StartsWith("how ") || lower.StartsWith("how do ") || lower.StartsWith("how can ")) return "how";
        if (lower.StartsWith("why ") || lower.StartsWith("why is ") || lower.StartsWith("why are ")) return "why";
        if (lower.StartsWith("can ") || lower.StartsWith("could ") || lower.StartsWith("should ") || lower.StartsWith("do ")) return "advice";
        return "general";
    }

    private static List<string> ExtractKeywords(string text)
    {
        var cleaned = Regex.Replace(text, @"[^a-zA-Z0-9\s]", " ").ToLowerInvariant();
        var words = cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var result = new List<string>();
        foreach (var word in words)
        {
            if (word.Length < 3) continue;
            if (Fillers.Contains(word)) continue;
            result.Add(word);
        }

        return result;
    }

    private static List<string> NormalizeKeywords(List<string> keywords)
    {
        var normalized = new List<string>();
        foreach (var keyword in keywords)
        {
            var mapped = keyword switch
            {
                "slushs" => "slush",
                "slushslam" => "slush slam",
                "beauslush" => "beauslush",
                "beauslushdotcom" => "beauslush.com",
                "beabob" => "beabob",
                "teddys" => "teddys",
                "rngs" => "rng rng",
                "rng" => "rng rng",
                "gamez" => "game",
                _ => keyword
            };

            if (!string.IsNullOrWhiteSpace(mapped) && !normalized.Contains(mapped, StringComparer.OrdinalIgnoreCase))
                normalized.Add(mapped);
        }

        return normalized;
    }

    private static string SelectMainTopic(List<string> keywords)
    {
        foreach (var keyword in keywords)
        {
            if (SiteFacts.ContainsKey(keyword))
                return keyword;
        }

        return keywords.FirstOrDefault() ?? "idea";
    }

    private static string Pick(string[] values)
    {
        return values[Random.Next(values.Length)];
    }

    private static string Capitalize(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        return char.ToUpperInvariant(text[0]) + text.Substring(1);
    }

    private static string TitleCase(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;
        return string.Join(' ', text.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => char.ToUpperInvariant(part[0]) + part.Substring(1)));
    }
}
