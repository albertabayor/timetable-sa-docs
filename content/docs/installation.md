---
title: "Installation"
description: "Set up `timetable-sa` in a modern Node.js or Bun TypeScript project."
---

# Installation

This guide covers the minimal setup needed to use `timetable-sa` in a Node.js or
TypeScript project. The package is runtime-light, but it assumes you are
working in a modern JavaScript environment that supports the current Node.js
ecosystem.

## Requirements

You need the following baseline environment:

- Node.js `18+` or a compatible Bun runtime,
- a TypeScript project if you want full type inference and generic state safety,
- an application-level module system compatible with modern package exports.

## Install with your package manager

Install the package with your package manager.

<CodeBlockTabs defaultValue="npm" groupId="package-manager">
  <CodeBlockTabsList>
    <CodeBlockTabsTrigger value="npm">npm</CodeBlockTabsTrigger>
    <CodeBlockTabsTrigger value="pnpm">pnpm</CodeBlockTabsTrigger>
    <CodeBlockTabsTrigger value="yarn">yarn</CodeBlockTabsTrigger>
    <CodeBlockTabsTrigger value="bun">bun</CodeBlockTabsTrigger>
  </CodeBlockTabsList>

  <CodeBlockTab value="npm">

```bash
npm install timetable-sa
```

  </CodeBlockTab>

  <CodeBlockTab value="pnpm">

```bash
pnpm add timetable-sa
```

  </CodeBlockTab>

  <CodeBlockTab value="yarn">

```bash
yarn add timetable-sa
```

  </CodeBlockTab>

  <CodeBlockTab value="bun">

```bash
bun add timetable-sa
```

  </CodeBlockTab>
</CodeBlockTabs>

## Import the public API

After installation, import the solver and the public types you need.

```ts
import { SimulatedAnnealing } from 'timetable-sa';
import type {
  Constraint,
  MoveGenerator,
  SAConfig,
  Solution,
  ProgressStats,
} from 'timetable-sa';
```

## Runtime notes

Several operational details are useful to know before integration.

- `solve()` is asynchronous and returns `Promise<Solution<TState>>`.
- if you use `onProgress`, the default `onProgressMode` is `'await'`, so slow
  callbacks can reduce throughput,
- the solve result can include `solution.diagnostics`, and you can also inspect
  the same grouped telemetry through `solver.getDiagnostics()` after the run,
- file logging with `logging.output: 'file' | 'both'` creates parent
  directories automatically,
- move generators receive a solver-provided clone, so they may mutate the state
  passed into `generate(...)`.

## Recommended next step

Once installation is complete, continue to [Quick Start](/docs/quickstart)
for a minimal end-to-end solver example.
