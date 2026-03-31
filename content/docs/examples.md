---
title: "Examples"
description: "Start with a small generic example, then adapt the same pattern to your domain."
---

# Examples

This page keeps the examples simple. Start with one small generic problem, then
adapt the same structure to your own domain.

## Minimal example

This example uses a list of numbers as the state. One hard constraint keeps the
sum at or below a limit, and one soft constraint prefers smaller totals.

```ts
import { SimulatedAnnealing } from 'timetable-sa';
import type { Constraint, MoveGenerator, SAConfig } from 'timetable-sa';

type State = {
  values: number[];
};

const constraints: Constraint<State>[] = [
  {
    name: 'Sum must stay under 20',
    type: 'hard',
    evaluate: (state) =>
      state.values.reduce((sum, value) => sum + value, 0) <= 20 ? 1 : 0,
  },
  {
    name: 'Prefer smaller totals',
    type: 'soft',
    weight: 5,
    evaluate: (state) => {
      const total = state.values.reduce((sum, value) => sum + value, 0);
      return Math.max(0, Math.min(1, 1 - total / 20));
    },
  },
];

const moves: MoveGenerator<State>[] = [
  {
    name: 'Adjust one value',
    canApply: (state) => state.values.length > 0,
    generate: (state) => {
      const index = Math.floor(Math.random() * state.values.length);
      const delta = Math.random() < 0.5 ? -1 : 1;
      state.values[index] = Math.max(0, state.values[index] + delta);
      return state;
    },
  },
];

const config: SAConfig<State> = {
  initialTemperature: 100,
  minTemperature: 0.01,
  coolingRate: 0.995,
  maxIterations: 10000,
  hardConstraintWeight: 1000,
  cloneState: (state) => ({ values: [...state.values] }),
};

const solver = new SimulatedAnnealing(
  { values: [8, 7, 9] },
  constraints,
  moves,
  config
);

const result = await solver.solve();

console.log(result.fitness);
console.log(result.hardViolations);
console.log(result.state);
```

## What this example shows

Use this example to understand the minimum pieces you need:

- a typed state object,
- at least one constraint,
- at least one move generator,
- a `cloneState` function,
- an awaited call to `solve()`.

## Advanced Phase 1.5 example

Once the minimal flow works, you can tune intensification more explicitly. This
example keeps the same generic shape, but it adds targeted Phase 1.5 controls
and reads the diagnostics payload after the solve.

```ts
const advancedConfig: SAConfig<State> = {
  initialTemperature: 100,
  minTemperature: 0.01,
  coolingRate: 0.995,
  maxIterations: 10000,
  hardConstraintWeight: 1000,
  cloneState: (state) => ({ values: [...state.values] }),
  enableIntensification: true,
  intensificationStartTemperatureMode: 'phase1-end',
  intensificationTargetedOperatorNames: ['Adjust one value'],
  intensificationTargetedSelectionRate: 0.8,
  intensificationBudgetFractionOfMaxIterations: 0.2,
  intensificationEarlyStopNoBestImproveIterations: 200,
};

const advancedSolver = new SimulatedAnnealing(
  { values: [8, 7, 9] },
  constraints,
  moves,
  advancedConfig
);

const advancedResult = await advancedSolver.solve();

console.log(advancedResult.diagnostics?.phaseTimings.totalRuntimeMs);
console.log(advancedResult.diagnostics?.intensification.phase15EndedByBudget);
```

This pattern is useful when you need to benchmark or debug why Phase 1.5 did
or did not improve hard feasibility.

## Next steps

After this example works, continue with:

- [Quick Start](/docs/quickstart) for a guided setup,
- [Configuration](/docs/configuration) for tuning options,
- [Testing Guide](/docs/testing-guide) for validating your constraints and
  moves.
