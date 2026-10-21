(() => {
    const chatLog = document.getElementById('chatLog');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendBtn');

    const conversation = {
        lastTopic: null,
        lastIntent: null,
        lastReply: null,
        turn: 0
    };

    const fillerWords = new Set([
        'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your',
        'yours', 'he', 'she', 'they', 'them', 'their', 'it', 'its', 'this',
        'that', 'these', 'those', 'there', 'here', 'of', 'to', 'for', 'from',
        'in', 'on', 'at', 'by', 'with', 'about', 'into', 'onto', 'over',
        'under', 'and', 'or', 'but', 'if', 'then', 'than', 'because', 'as',
        'while', 'when', 'where', 'who', 'whom', 'which', 'what', 'why', 'how',
        'do', 'does', 'did', 'doing', 'done', 'can', 'could', 'would', 'should',
        'will', 'shall', 'may', 'might', 'must', 'have', 'has', 'had', 'having',
        'just', 'really', 'very', 'some', 'any', 'all', 'more', 'most', 'much',
        'many', 'such', 'please', 'tell', 'show', 'explain', 'know', 'think',
        'want', 'need', 'like', 'make', 'get', 'got', 'go', 'going', 'work',
        'works', 'worked', 'thing', 'things', 'stuff', 'something', 'anything',
        'someone', 'one', 'ones', 'also', 'too', 'again', 'still', 'just', 'up'
    ]);

    const knowledge = [
        {
            id: 'beauslush',
            names: ['beauslush.com', 'beauslush', 'this site', 'the website', 'website'],
            keywords: ['beauslush', 'website', 'site'],
            summary: 'BeauSlush is a small collection of playful web games, experiments, and creative tools.',
            how: 'Open a game from the home page and use its on-screen controls. Each game is designed to be self-contained, so you can jump straight in.',
            why: 'The site is a playground for small ideas: games and tools are easier to explore when they are quick to open and simple to use.',
            where: 'Start from the BeauSlush home page. The game links are grouped there, and the logo at the top of a page returns you home.',
            controls: 'Each game has its own controls. Open the game page and look beside or above its main play area for the available actions.',
            aliases: ['project', 'games', 'playground']
        },
        {
            id: 'beabob',
            names: ['beabob'],
            keywords: ['beabob', 'assistant', 'chatbot', 'bot'],
            summary: 'BeaBob is the site assistant. I match your question to an intent and answer from local knowledge about BeauSlush and common project tasks.',
            how: 'Ask a complete question and include the subject you mean. For example, “How do I play Gomoku?” gives me more to work with than “how do I do it?”',
            why: 'I use a local set of facts and question patterns, so I can be quick and private but I do not know everything or browse the web.',
            where: 'You can find BeaBob from the game list on the home page.',
            controls: 'Type a question in the input and press Enter or click Send. Follow-up questions can refer to the last topic.',
            aliases: ['you', 'yourself', 'your name']
        },
        {
            id: 'gomoku',
            names: ['gomoku', 'five in a row'],
            keywords: ['gomoku', 'five', 'row', 'board'],
            summary: 'Gomoku is a turn-based board game where the goal is to make an unbroken line of five stones horizontally, vertically, or diagonally.',
            how: 'You play Black against the bot as White. Choose Easy or Hard, then click an empty intersection to place a stone. The bot replies after your move; New game resets the board.',
            why: 'The game checks the four line directions after each stone. The first side with five connected stones wins.',
            where: 'Open Gomoku from the home page game list.',
            controls: 'Choose Easy or Hard in the left panel, click an empty intersection to place a Black stone, and use New game to restart. Hard blocks immediate wins and looks for strong lines.',
            aliases: ['gomoku bot', 'hard bot', 'easy bot', 'gobang']
        },
        {
            id: 'shapes',
            names: ['shapes', 'shape game', 'shape editor'],
            keywords: ['shapes', 'shape', 'triangle', 'pentagon', 'hexagon', 'square', 'circle', 'star'],
            summary: 'Shapes is a small physics editor with squares, circles, triangles, stars, pentagons, and hexagons.',
            how: 'Drag a shape from the palette onto the canvas. Drag shapes on the canvas to move them; gravity and collisions let them fall and stack. Select one to change its color, scale, or rotation.',
            why: 'The canvas uses rigid-body physics, so the shapes respond to gravity and collide with each other and the floor.',
            where: 'Open Shapes from the home page game list.',
            controls: 'Drag a palette shape onto the canvas, then use the selected-shape controls for color, scale, rotation, and deletion. Clear all removes every shape.',
            aliases: ['physics', 'stacking shapes', 'shape color']
        },
        {
            id: 'slush slam',
            names: ['slush slam', 'slushslam'],
            keywords: ['slush', 'slam', 'stacking', 'blocks', 'tower'],
            summary: 'Slush Slam is a stacking game where you drop swinging blocks onto a tower and try to keep it balanced.',
            how: 'Watch the moving block and time your drop so it lands over the stack. Small overhangs can shrink the next block, so aim carefully and build height.',
            why: 'The tower gets harder to balance as the stack grows and the overlap between blocks gets smaller.',
            where: 'Open Slush Slam from the home page game list.',
            controls: 'Use the game’s drop control when the moving block is lined up with the tower. Check the game screen for its current score and restart control.',
            aliases: ['slush', 'stack', 'tower game']
        },
        {
            id: 'teddys',
            names: ['teddys', 'teddy'],
            keywords: ['teddys', 'teddy', 'scene', 'studio'],
            summary: 'Teddys is a teddy gallery and scene studio for arranging teddy images into a scene.',
            how: 'Choose a teddy from the gallery, add or drag it onto the stage, then adjust its position, size, or rotation with the controls.',
            why: 'The page is built as a small creative studio: the gallery supplies pieces and the stage lets you arrange them into a scene.',
            where: 'Open Teddys from the home page game list.',
            controls: 'Choose a teddy from the gallery, place it on the stage, and use the scene controls to move, resize, rotate, or remove it.',
            aliases: ['teddy studio', 'teddy game']
        },
        {
            id: 'rng rng',
            names: ['rng rng', 'rng'],
            keywords: ['rng', 'random', 'roll', 'slushles'],
            summary: 'RNG RNG is a luck-based mini-game where you roll for an RNG, roll within it for items, and collect slushles.',
            how: 'Roll to get an RNG, then roll inside that RNG to collect an item. You can buy more rolls with slushles.',
            why: 'The outcomes are weighted, so some results appear much less often than others.',
            where: 'Open RNG RNG from the home page game list.',
            controls: 'Use the roller to get an RNG, the inside-roll button for an item, and the buy-roll button when you have enough slushles.',
            aliases: ['luck game', 'random game']
        },
        {
            id: 'beabob site setup',
            names: ['github pages', 'static site', 'static version'],
            keywords: ['github', 'pages', 'static', 'hosting'],
            summary: 'The docs folder contains the static HTML version of the site, which can be hosted by GitHub Pages.',
            how: 'Publish the docs folder as the Pages source in the repository settings, or serve it locally with a simple static web server.',
            why: 'The static version runs in the browser and does not require an ASP.NET server for its pages.',
            where: 'The static files are in the docs folder of the project.',
            controls: 'For local testing, open docs/index.html in a browser. For server-side Razor pages, run the BeauSlushWebsite project instead.',
            aliases: ['github', 'docs folder']
        },
        {
            id: 'ad sense',
            names: ['adsense', 'ads.txt', 'advertising', 'ads'],
            keywords: ['adsense', 'ads', 'advertising', 'verification'],
            summary: 'AdSense site verification confirms that you control the site before Google reviews it for ads.',
            how: 'Use the verification method shown in your AdSense account, publish the exact code or file at the specified location, then run verification from the account page.',
            why: 'AdSense needs to verify site ownership and review site policy compliance before serving ads.',
            where: 'The verification instructions are shown in the AdSense site details for your domain.',
            controls: 'Copy the exact snippet from AdSense into the page head, or follow its ads.txt or meta-tag option. Then verify ownership in AdSense.',
            aliases: ['publisher id', 'google ads']
        },
        {
            id: 'credits',
            names: ['credits', 'credit', 'creator', 'who made'],
            keywords: ['credits', 'creator', 'made', 'author'],
            summary: 'The Credits page is the project’s thank-you page for the people involved.',
            how: 'Open Credits from the site navigation to see the names and contributions listed there.',
            why: 'It gives attribution to the people who helped with the project.',
            where: 'Use the Credits link in the site navigation.',
            controls: 'Open the Credits link in the top navigation.',
            aliases: ['contributors', 'thanks']
        },
        {
            id: 'code',
            names: ['javascript', 'c sharp', 'c#', 'code', 'coding', 'programming'],
            keywords: ['javascript', 'code', 'coding', 'programming', 'script', 'program'],
            summary: 'Code is a set of instructions a computer follows. In this project, browser interactions use JavaScript and the app pages use ASP.NET Razor.',
            how: 'Start with the smallest behavior you can test, make one change at a time, and use the browser console or build output to locate errors.',
            why: 'A program follows its written rules; unexpected results often come from a mismatch between the input, the condition, and the branch that runs.',
            where: 'The app source is in BeauSlushWebsite, while the static site is in docs.',
            controls: 'For the app, run `dotnet run --project BeauSlushWebsite/BeauSlushWebsite.csproj`. Static pages live under docs.',
            aliases: ['razor', 'asp.net', 'dotnet']
        },
        {
            id: 'running',
            names: ['run the site', 'run this', 'start the site', 'launch the app'],
            keywords: ['run', 'start', 'launch', 'localhost', 'terminal'],
            summary: 'The ASP.NET project is under BeauSlushWebsite, not at the repository root.',
            how: 'From the repository root, run `dotnet run --project BeauSlushWebsite/BeauSlushWebsite.csproj`, then open the localhost address printed by the app.',
            why: 'The root folder is not itself a .NET project; the project file is inside BeauSlushWebsite.',
            where: 'Run the command from the repository root, or change directory into BeauSlushWebsite first.',
            controls: 'Run `dotnet run --project BeauSlushWebsite/BeauSlushWebsite.csproj`. If the default port is already occupied, stop the other app process or run with `--urls http://localhost:5112`.',
            aliases: ['dotnet run', 'port in use', '5110']
        }
    ];

    const intentPatterns = {
        greeting: [/^(hi|hello|hey|yo|howdy|greetings|good morning|good afternoon|good evening)\b/],
        thanks: [/\b(thanks|thank you|thx|cheers)\b/],
        capability: [/\b(what can you do|what do you do|help|your capabilities|how can you help)\b/],
        identity: [/\b(who are you|what are you|your name|are you an ai|are you a bot)\b/],
        how: [/^(how|what are the steps|how do i|how can i|how do you|how does)\b/, /\b(how to|steps to|instructions for)\b/],
        why: [/^(why|what is the reason|what causes|how come)\b/, /\b(why does|why is|why are|why did)\b/],
        where: [/^(where|where can i|where do i|where is)\b/],
        when: [/^(when|when can i|when should i|when does)\b/],
        who: [/^(who|who made|who created|who is)\b/],
        definition: [/^(what is|what are|define|meaning of|explain)\b/, /\b(what does .+ mean|what is .+ for)\b/],
        controls: [/\b(controls?|buttons?|keys|play|use|operate|move|click|tap)\b/],
        troubleshooting: [/\b(not working|doesnt work|does not work|broken|bug|error|failed|failure|blank|white screen|wont|won't|cant|can't|stuck|crash|crashed)\b/],
        recommendation: [/\b(should i|which one|recommend|best way|what would you|what do you suggest)\b/],
        yesNo: [/^(can|could|would|will|is|are|do|does|did|has|have|should)\b/]
    };

    const responseStyles = {
        direct: [
            'Here’s the short version: ',
            'The useful answer is: ',
            'Sure. ',
            'In this project, '
        ],
        followUp: [
            'For the next step, ',
            'A practical next move: ',
            'If you’re doing that now, '
        ],
        clarification: [
            'I want to make sure I answer the right thing. ',
            'I may be missing one detail. ',
            'I can help with that, but I need a little more context. '
        ]
    };

    function normalize(input) {
        return input
            .toLowerCase()
            .replace(/[’']/g, "'")
            .replace(/\bwhats\b/g, 'what is')
            .replace(/\bwhat's\b/g, 'what is')
            .replace(/\bwho's\b/g, 'who is')
            .replace(/\bwhere's\b/g, 'where is')
            .replace(/\bhow's\b/g, 'how is')
            .replace(/\bcan't\b/g, 'cannot')
            .replace(/\bwon't\b/g, 'will not')
            .replace(/\bdon't\b/g, 'do not')
            .replace(/\bdoesn't\b/g, 'does not')
            .replace(/\bdidn't\b/g, 'did not')
            .replace(/\bwasn't\b/g, 'was not')
            .replace(/\baren't\b/g, 'are not')
            .replace(/\bisn't\b/g, 'is not')
            .replace(/\bwouldn't\b/g, 'would not')
            .replace(/\bcouldn't\b/g, 'could not')
            .replace(/\bshouldn't\b/g, 'should not')
            .replace(/[^a-z0-9.#\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenize(text) {
        return text.split(' ').filter(word => word && !fillerWords.has(word));
    }

    function detectIntent(text) {
        const greetingOnly = /^(hi|hello|hey|yo|howdy|greetings|good morning|good afternoon|good evening)[!.\s]*$/.test(text);
        const thanksOnly = /^(thanks|thank you|thx|cheers)[!.\s]*$/.test(text);
        if (greetingOnly) return 'greeting';
        if (thanksOnly) return 'thanks';

        const priority = [
            'troubleshooting',
            'capability',
            'identity',
            'recommendation',
            'controls',
            'how',
            'why',
            'where',
            'when',
            'who',
            'definition',
            'yesNo'
        ];
        for (const intent of priority) {
            const patterns = intentPatterns[intent];
            if (patterns.some(pattern => pattern.test(text))) return intent;
        }
        return 'general';
    }

    function scoreTopic(text, tokens, entry) {
        let score = 0;
        for (const name of entry.names) {
            if (text.includes(name)) score = Math.max(score, 10 + name.length);
        }
        for (const alias of entry.aliases || []) {
            if (text.includes(alias)) score = Math.max(score, 7 + alias.length / 10);
        }
        for (const keyword of entry.keywords) {
            if (tokens.includes(keyword)) score += 2;
        }
        return score;
    }

    function detectTopic(text, tokens) {
        const ranked = knowledge
            .map(entry => ({ entry, score: scoreTopic(text, tokens, entry) }))
            .filter(result => result.score > 0)
            .sort((left, right) => right.score - left.score);
        if (ranked.length && ranked[0].score >= 10) return ranked[0].entry;
        if (ranked.length && ranked[0].score >= 4 && tokens.length > 1) return ranked[0].entry;
        if (/\b(it|that|this|they|them|there|those)\b/.test(text)) {
            return knowledge.find(entry => entry.id === conversation.lastTopic) || null;
        }
        return null;
    }

    function answerArithmetic(text) {
        const expression = text.match(/(?:what is|calculate|compute|work out)?\s*(-?\d+(?:\.\d+)?)\s*(plus|add(?:ed)?(?:\s+to)?|\+|minus|subtract(?:ed)?(?:\s+from)?|−|\-|times|multiply|multiplied by|\*|×|x|divided by|divide|\/|÷)\s*(-?\d+(?:\.\d+)?)/);
        if (!expression) return null;

        const left = Number(expression[1]);
        const right = Number(expression[3]);
        const operator = expression[2];
        let result;

        if (/^(plus|add|added|\+)$/.test(operator)) result = left + right;
        else if (/^(minus|subtract|subtracted|−|\-)$/.test(operator)) result = left - right;
        else if (/^(times|multiply|multiplied by|\*|×|x)$/.test(operator)) result = left * right;
        else if (/^(divided by|divide|\/|÷)$/.test(operator)) {
            if (right === 0) return 'Division by zero is undefined.';
            result = left / right;
        }

        if (!Number.isFinite(result)) return 'That calculation is outside the range I can handle.';
        const cleanResult = Number.isInteger(result) ? String(result) : String(Number(result.toFixed(8)));
        return `${left} ${operator} ${right} = ${cleanResult}.`;
    }

    function answerSmallTalk(text) {
        if (/\b(are you|you are)\b.*\b(smart|intelligent|clever)\b/.test(text)) {
            return 'I can handle basic facts, arithmetic, and questions about this site, but I’m not a person and I can misunderstand things. Try me with a question and see.';
        }
        if (/^(how are you|how are you doing|how is it going)\b/.test(text)) {
            return choose([
                'Doing well, thanks for asking. What’s on your mind?',
                'Pretty good. I’m ready for a question or a bit of problem-solving.',
                'I’m here and ready to help. How are you?'
            ]);
        }
        if (/^(what|huh|what\?)$/.test(text)) {
            return 'What would you like to know? Ask me a complete question and I’ll do my best.';
        }
        if (/^(good morning|good afternoon|good evening|good night)$/.test(text)) {
            return `${capitalize(text)}! What can I help with?`;
        }
        return null;
    }

    function isLikelyNonsense(text, tokens) {
        const compact = text.replace(/[^a-z]/g, '');
        if (tokens.length === 0 && compact.length < 4) return false;
        if (tokens.length === 1 && !knowledge.some(entry => scoreTopic(text, tokens, entry) >= 10)) {
            const word = tokens[0];
            if (word.length < 2) return true;
            if (!/[aeiouy]/.test(word) || /[^aeiouy]{4,}/.test(word)) return true;
        }
        return false;
    }

    function choose(values) {
        const options = values.filter(value => value !== conversation.lastReply);
        const selected = options[Math.floor(Math.random() * options.length)] || values[0];
        conversation.lastReply = selected;
        return selected;
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function topicAnswer(topic, intent, original) {
        if (intent === 'how' || intent === 'controls') return topic.how;
        if (intent === 'why') return topic.why;
        if (intent === 'where') return topic.where;
        if (intent === 'who') return topic.id === 'credits' ? topic.summary : topic.summary;
        if (intent === 'definition') return topic.summary;
        if (intent === 'recommendation') return recommendationAnswer(topic, original);
        if (intent === 'troubleshooting') return troubleshootingAnswer(topic, original);
        if (intent === 'when') return whenAnswer(topic);
        if (intent === 'yesNo') return yesNoAnswer(topic, original);
        if (intent === 'general') return generalTopicAnswer(topic, original);
        return topic.summary;
    }

    function recommendationAnswer(topic, input) {
        if (topic.id === 'gomoku') return 'Start on Easy to learn the board. Switch to Hard when you want the bot to block immediate wins and build stronger lines.';
        if (topic.id === 'shapes') return 'Try dropping a few shapes from different heights, then use the color and transform controls on one shape at a time.';
        if (topic.id === 'running') return 'Run the project from the repository root with the explicit `--project` path. That avoids the “couldn’t find a project” error.';
        if (topic.id === 'code') return 'Make one small change, run the narrowest check, and read the first error message before changing anything else.';
        return `For ${topic.id}, start with the simplest path: ${topic.how}`;
    }

    function troubleshootingAnswer(topic, input) {
        const lower = input.toLowerCase();
        if (topic.id === 'running' || /port|localhost|dotnet/.test(lower)) {
            return 'If `dotnet run` says it cannot find a project, run `dotnet run --project BeauSlushWebsite/BeauSlushWebsite.csproj` from the repository root. If it says the address is already in use, another process owns that port; stop the old process or choose another port with `--urls http://localhost:5112`.';
        }
        if (topic.id === 'gomoku') {
            return 'First check that you opened the current app route rather than an older process on a reused port. Then reload the page and check the browser console for a script error. Tell me the URL and any visible error, and I can narrow it down.';
        }
        if (topic.id === 'shapes') {
            return 'Reload the page first, then check whether the Matter.js script loaded. If the issue is still there, tell me what shape you moved and what happened after release.';
        }
        if (topic.id === 'beabob') {
            return 'Try rephrasing as one direct question and include the subject, like “How do I open Gomoku?” I use local patterns, so vague follow-ups can be harder to resolve.';
        }
        return `For ${topic.id}, start by checking the exact error and what action caused it. Share those details and I can suggest a focused fix.`;
    }

    function whenAnswer(topic) {
        if (topic.id === 'running') return 'Start it whenever you want to test the ASP.NET version; keep the terminal process running while you use the local URL.';
        if (topic.id === 'gomoku') return 'You can switch to Hard before starting or during play; changing difficulty starts a fresh board.';
        return `You can open ${topic.id} whenever you want from the home page.`;
    }

    function yesNoAnswer(topic, input) {
        const lower = input.toLowerCase();
        if (topic.id === 'gomoku' && /hard|difficulty|bot/.test(lower)) return 'Yes. Choose Hard in the difficulty selector. The game resets and the bot will block immediate wins and score stronger lines.';
        if (topic.id === 'shapes' && /color|rotate|scale|move/.test(lower)) return 'Yes. Select the shape, then use its controls to change color, scale, or rotation; you can also drag it to move it.';
        if (topic.id === 'running') return 'Yes. The app runs locally with `dotnet run --project BeauSlushWebsite/BeauSlushWebsite.csproj`; open the localhost URL printed in the terminal.';
        return `Yes, I can help with ${topic.id}. ${topic.how}`;
    }

    function generalTopicAnswer(topic, input) {
        if (topic.id === 'code') return codingAnswer(input);
        if (topic.id === 'beabob site setup' && /publish|deploy|host/.test(input)) return 'Publish the `docs` folder for the static site, or deploy the ASP.NET project through a host that supports .NET. Keep secrets such as API keys in server-side environment variables, never in browser JavaScript.';
        return topic.summary;
    }

    function codingAnswer(input) {
        if (/\b(error|broken|not working|does not work|doesnt work|bug)\b/.test(input)) {
            return 'Start with the first error in the console or build output. Reproduce it, identify the file and line it names, then change one thing and rerun the same check.';
        }
        if (/\b(run|start|launch)\b/.test(input)) {
            return 'From the repository root, run `dotnet run --project BeauSlushWebsite/BeauSlushWebsite.csproj`, then open the localhost URL printed by the app.';
        }
        if (/\b(javascript|script|browser)\b/.test(input)) {
            return 'Browser JavaScript handles page interactions. Open the browser developer console to see runtime errors, and use `node --check path/to/script.js` for a quick syntax check.';
        }
        return 'The app is built with ASP.NET Razor pages and browser JavaScript. Tell me the behavior you want or the error you see, and I can suggest a targeted next step.';
    }

    function generalAnswer(intent, input) {
        if (intent === 'how') return 'I can give concrete steps when I know the topic. What are you trying to do, and where are you doing it: in a game, in the website, or in the project code?';
        if (intent === 'why') return 'I need the thing you’re asking about to explain the cause. What happened, and what did you expect instead?';
        if (intent === 'where') return 'Which page, file, or control are you looking for? Tell me the name and I’ll point you to the likely place.';
        if (intent === 'who') return 'Do you mean who made a particular game, who is listed in Credits, or who I am?';
        if (intent === 'definition') return 'What term or feature should I define? Add it to the question and I’ll be more specific.';
        if (intent === 'recommendation') return 'What are you choosing between, and what matters most to you? I can compare the options once I know the goal.';
        if (intent === 'troubleshooting') return 'I can help troubleshoot. What were you doing, what did you expect, and what actually happened?';
        if (intent === 'yesNo') return 'Probably, but I need the subject of the question. What are you asking about?';
        return choose([
            'I’m not sure which part you mean yet. Could you add the topic or ask it as a direct question?',
            'I can help, but I need one more detail: what are you trying to find out or do?',
            'Give me the subject and what you want to know about it, and I’ll make the answer more useful.'
        ]);
    }

    function answer(input) {
        const text = normalize(input);
        if (!text) return 'Type a question first and I’ll do my best.';
        conversation.turn++;

        const arithmetic = answerArithmetic(text);
        if (arithmetic) return arithmetic;

        const smallTalk = answerSmallTalk(text);
        if (smallTalk) return smallTalk;

        const intent = detectIntent(text);
        if (intent === 'greeting') return choose([
            'Hey! What are you curious about?',
            'Hi! Ask me about the games, the site, or working on the project.',
            'Hello! What can I help you figure out?'
        ]);
        if (intent === 'thanks') return choose([
            'You’re welcome!',
            'Anytime. What else are you working on?',
            'Glad that helped.'
        ]);
        if (intent === 'capability') return 'I can explain the BeauSlush games, point out how to run the project, and help with common coding or troubleshooting questions. I use local knowledge, so I’ll ask when I need more detail.';
        if (intent === 'identity') return 'I’m BeaBob, the small assistant on BeauSlush. I answer from this project’s built-in knowledge rather than a live web search.';

        const tokens = tokenize(text);
        const topic = detectTopic(text, tokens);
        if (topic) {
            conversation.lastTopic = topic.id;
            conversation.lastIntent = intent;
            const reply = topicAnswer(topic, intent, text);
            return responseForIntent(intent, topic, reply);
        }

        if (/\b(weather|temperature|forecast)\b/.test(text)) return 'I don’t have live weather or your location. Check a local forecast service for current conditions.';
        if (/\b(time|date|today)\b/.test(text)) return 'I don’t have a reliable live clock in this chat. Your device clock will have the current time and date.';
        if (isLikelyNonsense(text, tokens)) {
            return 'I’m not sure what that means. Could you check the spelling or tell me what you wanted to ask?';
        }
        if (conversation.lastTopic && /\b(what about|and|also|that|it|those|how about)\b/.test(text)) {
            const previous = knowledge.find(entry => entry.id === conversation.lastTopic);
            if (previous) {
                conversation.lastIntent = intent;
                return responseForIntent(intent, previous, topicAnswer(previous, intent, text));
            }
        }
        return generalAnswer(intent, text);
    }

    function responseForIntent(intent, topic, reply) {
        const prefixOptions = intent === 'how' || intent === 'controls'
            ? ['Here’s how: ', 'To do that, ', 'The steps are simple: ']
            : intent === 'troubleshooting'
                ? ['Let’s narrow it down. ', 'Start here: ', 'For this issue, ']
                : intent === 'why'
                    ? ['The reason is: ', 'That happens because ', 'The short explanation: ']
                    : intent === 'where'
                        ? ['You’ll find it here: ', 'Look here: ', 'Open this: ']
                        : intent === 'recommendation'
                            ? ['I’d suggest this: ', 'A good starting point is: ', 'My practical pick: ']
                            : intent === 'yesNo'
                                ? ['', 'Yes. ', 'Right. ']
                                : ['', 'In short, ', 'For ' + topic.id + ', '];
        const prefix = choose(prefixOptions);
        if (prefix && reply.toLowerCase().startsWith(prefix.toLowerCase())) return reply;
        return prefix + reply;
    }

    function appendMessage(who, text) {
        const element = document.createElement('div');
        element.className = `chat-message ${who}`;
        element.textContent = `${who === 'user' ? 'You' : 'BeaBob'}: ${text}`;
        chatLog.appendChild(element);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    function setSending(sending) {
        sendButton.disabled = sending;
        userInput.disabled = sending;
        sendButton.textContent = sending ? 'Thinking…' : 'Send';
    }

    async function requestRemoteAnswer(input) {
        if (!/\/beabob\/?$/i.test(window.location.pathname)) return null;
        try {
            const response = await fetch('/BeaBob?handler=Ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });
            if (!response.ok) return null;
            const data = await response.json();
            return typeof data.answer === 'string' && data.answer.trim() ? data.answer.trim() : null;
        } catch {
            return null;
        }
    }

    async function send() {
        const input = userInput.value.trim();
        if (!input || sendButton.disabled) return;
        appendMessage('user', input);
        userInput.value = '';
        setSending(true);
        const localResponse = answer(input);
        const remoteResponse = await requestRemoteAnswer(input);
        const response = remoteResponse || localResponse;
        const delay = Math.min(650, 180 + response.length * 2);
        window.setTimeout(() => {
            appendMessage('ai', response);
            setSending(false);
            userInput.focus();
        }, delay);
    }

    sendButton.addEventListener('click', send);
    userInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    });

    appendMessage('ai', 'Hi, I’m BeaBob. Ask me about the BeauSlush games, how to use them, or how to run the project.');
})();
