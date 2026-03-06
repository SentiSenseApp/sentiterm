# SentiTerm

**The open-source AI financial terminal for retail investors.**

> Professional terminals: $24,000/year.
> SentiTerm: Free. Forever.

Your AI. Your keys. Your terminal.

## What is this?

SentiTerm is a free, open-source desktop terminal that gives you institutional-grade financial intelligence powered by your own AI.

- Real-time sentiment analysis (bull/bear scores, confidence, trend)
- AI-clustered news stories (not just headlines -- actual analysis)
- Institutional flows (who's buying, who's selling, 13F data)
- Built-in AI assistant (bring your Claude, GPT, or any LLM)
- Terminal-style command bar (Cmd+K -- type "AAPL HDS" like a pro)

## Quick Start

```bash
git clone https://github.com/sentisense/sentiterm.git
cd sentiterm
npm install
cp .env.example .env  # Add your API keys
npm run dev
```

## You Need

1. **SentiSense API key** (free tier available) -- sign up at sentisense.ai
2. **Your own AI key** (optional) -- Claude, OpenAI, or run local

## Commands

Type these in the command bar (Cmd+K):

| Command | What it does |
|---------|-------------|
| `AAPL` | Open Apple stock page |
| `NVDA SENT` | NVIDIA sentiment analysis |
| `AAPL HDS` | Who holds Apple stock |
| `FLOWS` | Institutional money flows |
| `HF` | Hedge fund moves |
| `13D` | Activist investor stakes |
| `who is buying TSLA` | Natural language works too |

## Why?

Because $24,000/year for a professional terminal is insane.
Because retail investors deserve the same data institutions get.
Because AI should work for you, not the other way around.

## Tech Stack

- Electron + electron-vite
- React 18 + TypeScript
- Tailwind CSS (dark terminal theme)
- Zustand state management
- SentiSense API for financial data
- BYOAI (Bring Your Own AI)

## License

MIT -- do whatever you want with it.

Built by @sentisenseapp
