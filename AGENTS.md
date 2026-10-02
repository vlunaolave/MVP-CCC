<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud

The development server is `npm run dev` and listens on port 43123. Node.js 20.9 or newer is required.

Copy `.env.example` to `.env` before Prisma commands. For an unattended database, run `npx prisma migrate deploy` and then `npx prisma db seed`. `npm run db:setup` calls `prisma migrate dev`, which can prompt, so it is not suitable for Cloud Agent setup.

Demo accounts and the INNOVA VALLE walkthrough are in `README.md`.

The application is on `mvp-inteligencia-empresarial`. `main` is an empty initial commit, so dependency install finds no `package.json` there.
