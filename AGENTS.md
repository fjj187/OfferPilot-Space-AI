AGENTS
[Context]

Project: chatgpt-vue3-light-mvp
Stack: Vue 3, Vite 8, TypeScript, Pinia, Naive UI, UnoCSS
Package manager: pnpm (see packageManager in package.json)
Runtime: Node >= 22.12.x, pnpm >= 10.x (see engines in package.json)
Entry: src/main.ts, root HTML index.html
Styling: UnoCSS + Sass
Linting: ESLint (flat config), Stylelint
Env: copy .env.template to .env and fill VITE_*_KEY values for real model APIs.
[Conventions]

Prefer <script setup lang="tsx"> in Vue SFCs.
Keep changes small and follow existing project structure.
Update docs when behavior changes.
Do not manually edit generated declarations: auto-imports.d.ts, components.d.ts, components-instance.d.ts.
Avoid using PowerShell read/write pipelines to modify source files that contain Chinese text. Prefer apply_patch for scoped edits. If a whole-file rewrite is unavoidable, explicitly read and write UTF-8, then run a mojibake scan before finishing.
[Commands]

Install: pnpm i
Dev: pnpm dev (Vite serves on port 2048 with --host)
Build: pnpm build
GitHub Pages build: pnpm build:gh-pages (sets VITE_ROUTER_MODE=hash)
Preview: pnpm preview
Lint: pnpm lint
Lint fix: pnpm lint:fix
Stylelint: pnpm stylelint
Stylelint fix: pnpm stylelint:fix
