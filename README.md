# timetable-sa-docs

Web documentation app for `timetable-sa`, built with TanStack Start and
Fumadocs.

## Architecture

- Source of truth content lives in the package repository at `timetable-sa/docs`.
- This repository renders the docs web app from `content/docs`.
- Docs content is synced and transformed at build-time, not fetched at runtime.

## Local development

Install dependencies:

```bash
bun install
```

Run development server:

```bash
bun run dev
```

Open docs:

- Home: `/`
- Documentation: `/docs`

## Docs sync workflow

Sync raw markdown from the package repository and transform for Fumadocs:

```bash
bun run sync:docs -- --source ../timetable-sa/docs
bun run transform:docs
```

The sync pipeline:

1. copies markdown files into `.cache/docs-raw`,
2. transforms them into `content/docs`,
3. injects required frontmatter (`title`, `description`),
4. rewrites internal `.md` links,
5. regenerates `content/docs/meta.json`.

## Quality gates

Run the local quality gate:

```bash
bun run ci:check
```

This runs:

1. typecheck,
2. build,
3. frontmatter validation,
4. internal link check.

## GitHub workflows

- `docs-sync.yml`: syncs docs from package repository and opens PR.
- `ci.yml`: validates each PR and push to `main`.
- `deploy.yml`: builds on `main` and deploys to Vercel when secrets are set.
