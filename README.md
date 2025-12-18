# SAT Vocab Helper 📚

A simple, fast voice-powered vocabulary lookup tool for SAT students. Tap a button, say a word, and instantly hear its definition.

## Features

- 🎤 **Voice Input** - Uses browser's built-in speech recognition (no external API)
- ⚡ **Fast Definitions** - GPT-4o mini provides quick, concise definitions
- 🔊 **Audio Output** - Definitions are read aloud automatically
- 📱 **Mobile Friendly** - Works great on phones for quick lookups
- 🔐 **Privacy First** - API key stored locally in your browser

## Quick Start

1. **Install dependencies:**
   ```bash
   cd sat-vocab-helper
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open http://localhost:3000** in your browser (Chrome recommended for best speech recognition support)

4. **Enter your OpenAI API key** when prompted

5. **Tap the microphone and say any word!**

## How It Works

1. Click the microphone button
2. Say the word you want to look up
3. The word is sent to GPT-4o mini with a minimal prompt
4. The definition is displayed and read aloud

## Why GPT-4o mini?

- **Fast** - Low latency responses
- **Cheap** - Costs fractions of a cent per query
- **Smart enough** - Handles misspellings and provides accurate definitions

## Browser Support

- **Chrome/Edge** - Full support ✅
- **Firefox** - Limited speech recognition support
- **Safari** - Speech recognition may require permissions

## Tech Stack

- React 18
- Vite
- Web Speech API (speech recognition)
- Speech Synthesis API (text-to-speech)
- OpenAI GPT-4o mini

## Cost Estimate

Each word lookup uses approximately 50-100 tokens, costing less than $0.001 per query with GPT-4o mini.


