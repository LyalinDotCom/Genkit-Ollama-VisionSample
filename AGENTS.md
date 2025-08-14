# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js app with route handlers in `app/api/*` (e.g., `extract-text`, `models`, `check-ollama`) and UI in `app/components/*`.
- `lib/`: Core logic. Genkit setup and flows in `lib/genkit/{config.ts,flows.ts}`; Ollama helpers in `lib/ollama.ts`; shared utilities in `lib/utils.ts`.
- `public/`: Static assets (e.g., `public/screenshot.png`).
- `next.config.ts`, `tsconfig.json`: Build and TS settings. Path alias `@/*` maps to repo root.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server on `http://localhost:9002` (Turbopack).
- `npm run genkit:watch`: Start Genkit runtime with hot reload and Developer UI on `http://localhost:4000`.
- `npm run build`: Create production build.
- `npm start`: Run the built app.
- `npm run lint`: ESLint via Next.
- `npm run typecheck`: TypeScript checks without emitting.

Tip: Run `genkit:watch` and `dev` in separate terminals.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Prefer functional React components.
- Indentation: 2 spaces; avoid semicolon churn; keep imports ordered; remove unused code.
- Filenames: Components `PascalCase.tsx` (e.g., `ImageUpload.tsx`); hooks `camelCase.ts` starting with `use` (e.g., `useLocalStorage.ts`); API routes use kebab-case folders (e.g., `app/api/extract-text`).
- Paths: Use `@/` alias for absolute imports (e.g., `@/lib/genkit/flows`).
- Linting: Fix issues before committing (`npm run lint`).

## Testing Guidelines
- No formal test suite yet. Validate flows via the Genkit Developer UI and manual API calls.
- Example (extract text):
  ```bash
  curl -X POST http://localhost:9002/api/extract-text \
    -H 'content-type: application/json' \
    -d '{"model":"llava:7b","imageBase64":"<base64>","outputFormat":"text"}'
  ```
- If adding tests: colocate `*.test.ts(x)` next to sources or under `__tests__/`; prefer React Testing Library for components and Vitest/Jest for libs.

## Commit & Pull Request Guidelines
- Commits: Imperative, concise subject (≤50 chars), body explains why. Example: `fix(flow): stream final chunks reliably`.
- PRs: Clear description, linked issues, test steps, screenshots/GIFs for UI, note env/config changes. Keep diffs focused.

## Security & Configuration Tips
- Ollama endpoint: set `OLLAMA_SERVER_ADDRESS` (defaults to `http://127.0.0.1:11434`).
- Images >10MB are rejected in `extractTextFromImage`—optimize before upload.
- Do not commit secrets; use `.env.local` for local overrides.
