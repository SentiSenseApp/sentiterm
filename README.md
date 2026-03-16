# SentiTerm

**The open-source AI financial terminal built on the SentiSense API.**

> We built a terminal and gave you the source code.
> You bring the API key. We bring the intelligence.

Your AI. Your keys. Your terminal.

## What is this?

SentiTerm is an open-source Electron desktop app that turns the [SentiSense API](https://sentisense.ai) into a full terminal experience. It's a reference implementation, a power-user tool, and a playground for building on top of SentiSense data.

- Real-time sentiment analysis (bull/bear scores, confidence, trend)
- AI-clustered news stories with full narrative reports
- Institutional flows (who's buying, who's selling, 13F data)
- Live document feeds with source embeds (X, Reddit, News, Substack)
- Market Mood index with fear/greed gauge and sector breakdown
- Built-in AI assistant (Claude via API key or Claude Code)
- Terminal-style command bar (Cmd+K -- type "AAPL HDS" like a pro)

## Quick Start

```bash
git clone https://github.com/SentiSenseApp/sentiterm.git
cd sentiterm
npm install
npm run dev
```

## You Need

1. **SentiSense API key** -- get one at [app.sentisense.ai/settings/developer](https://app.sentisense.ai/settings/developer). Free tier gets you started, PRO unlocks full access.
2. **Claude API key** (optional) -- for the AI assistant. Or use Claude Code if installed locally.

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
| `MOOD` | Market Mood index |
| `FEED` | Live document feed |
| `who is buying TSLA` | Natural language works too |

## Why Open Source?

Because we think the best way to show what the SentiSense API can do is to let you see how it's built. Fork it, extend it, ship your own version. The API does the heavy lifting -- the terminal is just one way to use it.

## Tech Stack

- Electron + electron-vite
- React 18 + TypeScript
- Tailwind CSS (dark terminal theme)
- Zustand state management
- SentiSense API for financial data
- Claude Agent SDK for AI assistant

## License

MIT -- do whatever you want with it.

Built by [@sentisenseapp](https://x.com/sentisenseapp)
