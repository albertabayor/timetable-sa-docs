---
title: "Migration Guide"
description: "Migrate older integrations to the current generic `timetable-sa` solver API."
---

# Migration Guide

This guide helps you migrate from older, more domain-specific usage patterns to
the current generic solver API. The modern package surface is intentionally more
abstract: the library owns the search engine, while you own the domain model,
constraints, and move operators.

## Migrate constructor usage

Older usage patterns commonly passed domain collections directly into the solver
constructor.

Old pattern:

```ts
new SimulatedAnnealing(rooms, lecturers, classes, config)
```

Current pattern:

```ts
new SimulatedAnnealing(initialState, constraints, moveGenerators, config)
```

The conceptual shift is important. You now encode domain logic explicitly in
`TState`, `Constraint<TState>`, and `MoveGenerator<TState>`.

## Migrate to async solving

`solve()` is asynchronous and returns `Promise<Solution<TState>>`.

Update call sites accordingly.

```ts
const result = await solver.solve();
```

If you previously treated solving as synchronous, you may need to propagate
`async` through service, controller, or CLI layers.

## Migrate the constraint score contract

The current solver expects `Constraint.evaluate(state)` to return a finite
satisfaction score in `[0, 1]`.

- `1` means satisfied,
- `0` means violated,
- intermediate values mean partial satisfaction.

If older code used penalty-style semantics where larger numbers meant worse
states, you must invert or normalize that logic.

## Migrate move-generator assumptions

The current engine clones state before calling `generate(...)`. That means move
generators may mutate the provided working state directly.

This differs from designs where move operators are expected to deep-clone their
input on every call.

## Migrate progress callbacks

If you use `onProgress`, make the callback mode explicit when behavior matters.

```ts
onProgressMode: 'await' | 'fire-and-forget'
```

Also note that the callback receives `state = null` in the current
implementation for performance reasons.

Do not throw from `onProgress` to stop the solver. Callback errors are still
caught and logged for backward compatibility, so cancellation must use
`cancelSignal`.

## Migrate cancellation handling

Use `SAConfig.cancelSignal` when application code must stop a running solve.
The field accepts an `AbortController.signal` or any object with an `aborted`
boolean property.

```ts
const controller = new AbortController();

const solver = new SimulatedAnnealing(initialState, constraints, moves, {
  ...config,
  cancelSignal: controller.signal,
});

controller.abort();
```

When the signal is aborted, `solve()` rejects with `SolveCancelledError` and
does not create a final `Solution`.

## Migrate Phase 1.5 start-temperature assumptions

The current branch no longer defaults to restarting Phase 1.5 from
`initialTemperature`.

Instead, the default behavior is:

- `intensificationStartTemperatureMode: 'phase1-end'`,
- optional scaling through `intensificationStartTempMultiplier`,
- optional capping through `intensificationStartTempCapRatio`.

If your older tuning assumed the legacy restart behavior, make it explicit.

```ts
intensificationStartTemperatureMode: 'initial-reset'
```

This preserves the old mental model of each intensification attempt beginning
from the configured `initialTemperature`.

## Migrate operator targeting assumptions

Older mental models often described Phase 1 and Phase 1.5 as preferring
operators whose names merely looked like repair operators. The current API
exposes an explicit targeting surface.

```ts
const noRoomConflict: Constraint<TimetableState> = {
  name: 'No room conflict',
  key: 'no_room_conflict',
  type: 'hard',
  evaluate: evaluateRoomConflicts,
};

const fixRoomConflict: MoveGenerator<TimetableState> = {
  name: 'Fix room conflict',
  targetConstraintTypes: ['hard'],
  targetConstraintKeys: ['no_room_conflict'],
  canApply: canRepairRooms,
  generate: repairRoomConflict,
};
```

The metadata fields are optional, so existing constraints and move generators
remain compatible. Add them when you want predictable hard-repair targeting.

You can still use config-level explicit names:

```ts
intensificationTargetedOperatorNames: ['Repair hard conflict']
```

Matching is case-insensitive, but it is still an exact name match. For targeting
that survives display-name changes, prefer stable `Constraint.key` values and
matching `MoveGenerator.targetConstraintKeys` instead of substring assumptions.

## Migrate Phase 1.5 budget assumptions

The current implementation caps total Phase 1.5 work and can stop an attempt
early when the global best hard-violation objective stalls.

```ts
intensificationBudgetFractionOfMaxIterations: 0.25,
intensificationEarlyStopNoBestImproveIterations: 800,
```

This means `intensificationIterations * maxIntensificationAttempts` is no
longer the whole story. The true upper bound is the smaller of the per-attempt
settings and the global Phase 1.5 budget.

## Migrate telemetry and benchmarking code

If you previously relied only on logs or `onProgress` to understand solver
behavior, use the new diagnostics surface for post-run analysis.

- Read `solution.diagnostics` from the solve result.
- Call `solver.getDiagnostics()` when you want a snapshot copy after the run.

This is the preferred branch-compatible way to inspect timing, first-feasible
milestones, budget usage, and Phase 1.5 stop reasons.

## Migrate logging setup

To log to files, set `logging.output` and `logging.filePath` explicitly.

```ts
logging: {
  enabled: true,
  output: 'file',
  filePath: './logs/sa.log',
}
```

The logger creates parent directories automatically.

## Migrate error handling

If older integration code relied on generic catches, prefer typed catches where
appropriate.

- `SAConfigError`
- `ConstraintValidationError`
- `SolveConcurrencyError`
- `SolveCancelledError`

You should also be aware that user-thrown exceptions from constraint evaluation
can still propagate as plain errors.

## Migrate to `timetable-sa@3.2.1`

Version `3.2.1` keeps the existing constructor, constraint, and move-generator
contracts compatible. The new targeting metadata is additive.

Use this release to improve hard-repair targeting without rewriting your solver
integration:

1. Add stable `key` values to hard constraints that have dedicated repair moves.
2. Add matching `targetConstraintKeys` to precise repair operators.
3. Add `targetConstraintTypes: ['hard']` to broad feasibility-repair operators.
4. Keep `intensificationTargetedOperatorNames` only when a deployment needs to
   prefer exact operator names from configuration.

If your old tuning depended on operator names containing words such as `fix`,
`capacity`, or `lecturer`, migrate that intent to metadata. Metadata targeting is
more predictable because it does not depend on display labels.

## Recommended migration sequence

Use this order to reduce migration risk.

1. Define a typed `TState` that contains the full mutable candidate solution.
2. Move all domain rules into `Constraint` implementations.
3. Implement a fast, deterministic `cloneState`.
4. Port mutation logic into `MoveGenerator` implementations.
5. Add progress callbacks and logging only after the base solve works.
6. Run repeated solves and tune parameters empirically.

## Next steps

Once the migration is complete:

- read [API Reference](/docs/api-reference) to verify current contracts,
- read [Configuration](/docs/configuration) to tune the new runtime surface,
- read [Troubleshooting](/docs/troubleshooting) if the migrated system behaves
  differently than expected.
