# CLAUDE.md -- SentiTerm

## Project
SentiTerm -- open-source Electron-based financial terminal powered by SentiSense API.

## Stack
- Electron + electron-vite
- React 18 + TypeScript (strict)
- Tailwind CSS (dark terminal theme)
- Zustand for state
- @anthropic-ai/sdk for Claude integration
- sentisense SDK (https://github.com/SentiSenseApp/sentisense-node)

## Commands
- `npm run dev` -- Start Electron in dev mode
- `npm run build` -- Production build
- `npm run lint` -- ESLint
- `npm run typecheck` -- TypeScript check

## Architecture
- `src/main/` -- Electron main process (IPC, Claude SDK, system integration)
- `src/renderer/` -- React frontend (all UI components)
- `src/preload/` -- Electron context bridge
- `src/renderer/lib/mockData.ts` -- Mock data for demo mode

## Conventions
- Functional components with hooks only
- All API calls go through the sentisense SDK via IPC
- Claude integration lives in main process, communicates via IPC
- Command bar uses function registry pattern (registry.ts)
- Dark terminal theme -- all colors from Tailwind config
- Commit messages: conventional commits format

## Key Files
- `src/renderer/components/CommandBar/registry.ts` -- Function definitions for Cmd+K
- `src/renderer/components/Claude/ClaudePanel.tsx` -- Main AI chat interface
- `src/main/ipc/sentisense.ts` -- SentiSense API bridge (main process)
- `src/renderer/store/index.ts` -- Zustand store (settings, watchlist, chat)

## Do Not
- Never hardcode API keys
- Never make SentiSense API calls outside the SDK
- Never add AI inference costs to SentiSense (BYOAI model)
- No Co-Authored-By lines in commits (this is a public repo)
