# timetable-sa-docs

Web documentation app for `timetable-sa`, built with TanStack Start and
Fumadocs.

## Architecture

- Source of truth content lives in this repository at `content/docs`.
- `timetable-sa` package repository links to this docs app for all documentation.
- Docs are authored and reviewed directly in this repository.

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

- `ci.yml`: validates each PR and push to `main`.
- `deploy.yml`: builds on `main` and deploys to Vercel when secrets are set.
