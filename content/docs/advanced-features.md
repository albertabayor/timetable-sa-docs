---
title: "Algorithm and Runtime Behavior"
description: "Dive into phase logic, acceptance rules, and search behavior in the runtime engine."
---

# Algorithm and Runtime Behavior

This document explains how the solver actually behaves at runtime. It maps the
public concepts in `timetable-sa` to the implementation in
`src/core/SimulatedAnnealing.ts`, `src/core/policies/`, `src/core/tabu/`, and
`src/core/telemetry/`, with emphasis on decision rules, phase transitions,
probability models, and operational consequences.

## Optimization lifecycle

The solver is organized into three sequential phases: Phase 1, optional Phase
1.5 intensification, and Phase 2. The phases share the same state model and
fitness function, but they use different acceptance and search policies.

### Phase 1

Phase 1 exists to reduce hard-constraint violations as aggressively as
possible.

At runtime, Phase 1 begins immediately after the initial state is evaluated.
The loop continues while all of the following conditions hold:

- `temperature > initialTemperature / 10`,
- `phase1Iteration < floor(maxIterations * 0.6)`,
- `bestHardViolations > 0`.

This means Phase 1 is not driven by stagnation alone. It has both a
temperature-based boundary and an explicit iteration budget equal to 60 percent
of `maxIterations`.

### Phase 1.5 intensification

Phase 1.5 runs only when these conditions are true:

- Phase 1 ends with `bestHardViolations > 0`, and
- `enableIntensification` resolves to `true`.

Intensification is a bounded restart-based local search over remaining hard
violations. It does not replace Phase 2. Even if intensification fails to reach
feasibility, the solver still proceeds to Phase 2 with the best state found so
far.

### Phase 2

Phase 2 refines total fitness while preserving the best hard-violation count
achieved before or during the phase.

The loop continues while:

- `temperature > minTemperature`, and
- `iteration < maxIterations`.

Unlike some textbook formulations, this implementation still permits moves that
reduce the best-known hard-violation count in Phase 2. It is therefore better
viewed as a constrained global refinement phase than as a purely soft-only
optimization phase.

## Fitness model

The solver uses a single scalar objective function, but the phases interpret it
through different acceptance rules.

### Penalty decomposition

For a state `s`, the engine computes:

```text
fitness(s) = hardConstraintWeight * hardPenalty(s) + softPenalty(s)

hardPenalty(s) = sum over hard constraints of (1 - score_c(s))
softPenalty(s) = sum over soft constraints of (1 - score_c(s)) * weight_c
```

where `score_c(s) in [0, 1]` and a higher score means better satisfaction.

### Violation counts versus penalties

The implementation distinguishes between penalty magnitude and violation count.

- Penalties are continuous because they are based on `1 - score`.
- Violation counts are discrete because they are derived from `getViolations()`
  or a heuristic fallback.

This separation is important because phase decisions may use hard-violation
counts, while move acceptance also uses the scalar fitness.

## Acceptance policies

The solver delegates acceptance probabilities to `AcceptancePolicy.ts`. The
rules are intentionally asymmetric between Phase 1 and Phase 2.

### Phase 1 acceptance

Phase 1 prioritizes lower hard-violation count before all other concerns.

```text
if newHardViolations < currentHardViolations:
  accept with probability 1

else if newHardViolations == currentHardViolations:
  if newFitness < currentFitness:
    accept with probability 1
  else:
    accept with probability exp((currentFitness - newFitness) / temperature)

else:
  accept with probability 0
```

This policy has two structural implications:

- Phase 1 never accepts a move that worsens hard-violation count.
- When hard-violation count is unchanged, the phase falls back to a standard
  Metropolis-style rule on total fitness.

### Phase 2 acceptance

Phase 2 uses the best hard-violation count seen so far as a hard safety bound.

```text
if newHardViolations > bestHardViolations:
  accept with probability 0

else if newHardViolations < bestHardViolations:
  accept with probability 1

else if newFitness < currentFitness:
  accept with probability 1

else:
  accept with probability exp((currentFitness - newFitness) / temperature)
```

The difference from Phase 1 is subtle but important: Phase 2 compares against
`bestHardViolations`, not `currentHardViolations`.

## Numerical stability

The probability functions use `safeExp(...)` to prevent catastrophic overflow
and underflow.

```text
if exponent < -700: return 0
if exponent > 700: return +Infinity
else return exp(exponent)
```

For finite annealing temperatures used by the solver, this keeps acceptance
computation numerically stable even for large fitness differences.

## Tabu search integration

Tabu search is optional and resolves from configuration defaults. When enabled,
it acts as a pre-acceptance screening stage.

### Membership rule

The tabu list stores the iteration at which a state signature was added. A
state remains tabu while:

```text
currentIteration - addedAt < tabuTenure
```

The implementation therefore uses relative age, not explicit expiration
timestamps.

### Aspiration rule

If `aspirationEnabled` is true, a tabu state is still accepted for evaluation
when:

```text
newFitness < globalBestFitness
```

There is no secondary aspiration threshold such as a 10 percent improvement
rule.

### Cleanup policy

`TabuMemory` uses two cleanup mechanisms:

1. Expire entries whose age is greater than or equal to `tabuTenure`.
2. If the remaining size exceeds `maxSize * 0.8`, sort entries by insertion
   iteration and remove the oldest 30 percent.

This is not a classic strict LRU cache. It is a hybrid of tenure-based expiry
and coarse-grained oldest-entry trimming.

## State signature generation

The tabu mechanism depends on deterministic state signatures. The implementation
uses a layered fallback strategy.

### Resolution order

The solver generates signatures in this order:

1. Try `config.getStateSignature(state)` if provided.
2. If the custom function throws, log a warning and fall back.
3. If `state.schedule` exists and is an array, derive a compact assignment-based
   signature from `classId`, `timeSlot.day`, `timeSlot.startTime`, and `room`.
4. Otherwise, use `stableStringify(state)`.
5. If deterministic serialization still fails, throw a plain `Error` asking the
   caller to provide `config.getStateSignature`.

### `stableStringify(...)`

`stableStringify(...)` differs from raw `JSON.stringify(...)` in several ways:

- object keys are sorted,
- arrays preserve order,
- circular references are rendered as `[Circular]`,
- functions and symbols are represented with placeholders,
- `bigint` values are serialized with an `n` suffix.

For generic state objects, this produces more stable signatures than direct
JSON serialization.

## Operator selection

The solver uses `OperatorSelectionPolicy` for the final operator choice, but the
candidate set itself is phase-sensitive.

### Global selection modes

The public selection modes are:

- `'hybrid'`: 30 percent random choice, 70 percent weighted choice.
- `'roulette-wheel'`: always weighted choice.

The weighted score for operator `i` is:

```text
(improvements_i + alpha) / (attempts_i + beta)
```

with `alpha = 1` and `beta = 2`.

### Phase 1 targeting heuristics

When `prioritizeHardFixes` is true, the solver first narrows the candidate set.
It prefers operators whose names suggest hard-fix behavior. Two layers are used:

1. A fallback filter that prefers names containing terms such as `fix` or
   `swap friday`.
2. A more specific hinting layer that compares violated hard-constraint names to
   move generator names and looks for substrings such as `exclusive`,
   `lecturer`, `room conflict`, `capacity`, `max daily`, `friday`, and
   `prayer`.

If targeted generators exist, they are selected with 70 percent probability;
otherwise, the full applicable set is used.

### Intensification targeting heuristics

Phase 1.5 does not use the full `OperatorSelectionPolicy` selection path. It
first filters applicable operators, then resolves an optional targeted set
based on `config.intensificationTargetedOperatorNames`.

- Matching uses a case-insensitive exact operator-name comparison.
- If the targeted set is non-empty, it is chosen with probability
  `intensificationTargetedSelectionRate`.
- Otherwise, the solver chooses from all applicable generators.

If you do not provide `intensificationTargetedOperatorNames`, Phase 1.5 falls
back to the full applicable generator set.

## Reheating

Reheating is an optional stagnation-escape mechanism present in both Phase 1 and
Phase 2.

### Trigger conditions in Phase 1 and Phase 2

Reheating occurs only when all of the following are true:

- `reheatingThreshold` is configured,
- `iterationsWithoutImprovement >= reheatingThreshold`,
- `reheats < maxReheats`,
- `temperature < initialTemperature / 100`.

When triggered, the solver applies:

```text
temperature = temperature * reheatingFactor
reheats += 1
iterationsWithoutImprovement = 0
```

The implementation does not clamp reheated temperature to `initialTemperature`.

### Progress side effects

A reheating event can force a progress callback if callback reporting is
enabled. It also emits info-level logs and hard-violation breakdown logs.

## Intensification mechanics

Intensification is a restart-bounded hard-violation search procedure rather than
a fixed-temperature local search at the minimum Phase 1 temperature.

### Attempt structure

For each attempt:

1. Reset the working state to the current `bestState`.
2. Reset `currentFitness` and `currentHardViolations` to the current best.
3. Resolve the start temperature with
   `resolveIntensificationStartTemperature(phase1EndTemperature)`.
4. Cap the total Phase 1.5 work by both `intensificationIterations` and the
   remaining global Phase 1.5 budget.
5. Run until one of these conditions wins:
   a local success, a per-attempt early stop, an exhausted attempt budget, or
   an exhausted global Phase 1.5 budget.

By default, the start temperature is derived from the Phase 1 terminal
temperature and then scaled and capped by
`intensificationStartTempMultiplier` and
`intensificationStartTempCapRatio`. If you need the legacy restart behavior,
set `intensificationStartTemperatureMode: 'initial-reset'`.

### Acceptance rules inside intensification

For candidate state `s'`:

- If `newHardViolations < currentHardViolations`, accept unconditionally.
- If hard violations are equal and `newFitness < currentFitness`, accept
  unconditionally.
- If hard violations are equal and fitness is worse, accept with probability
  `exp((currentFitness - newFitness) / intensificationTemp)`.
- If hard violations are worse, accept only with a very small escape
  probability:

```text
safeExp(-1 / (intensificationTemp / 10000)) * 0.02
```

### Stagnation rule inside intensification

If `stagnationCounter >= intensificationStagnationLimit`, the engine reheats the
local search by setting:

```text
intensificationTemp = max(minTemperature, intensificationTemp * 0.5)
stagnationCounter = 0
```

After every intensification iteration, the temperature is cooled by:

```text
intensificationTemp *= 0.999
```

This means intensification uses its own cooling schedule and its own local
reheating rule.

### Budget and early-stop rules

Phase 1.5 is not only bounded per attempt. The implementation also applies a
global budget cap and an explicit early-stop rule.

- The global budget is
  `floor(maxIterations * intensificationBudgetFractionOfMaxIterations)`.
- `remainingBudget` is decremented on every Phase 1.5 iteration.
- If `noBestImproveCounter` reaches
  `intensificationEarlyStopNoBestImproveIterations`, the current attempt ends
  even if its local iteration budget is not exhausted.
- If the global budget reaches zero while hard violations remain,
  `phase15EndedByBudget` is recorded in diagnostics.

### Tabu behavior inside intensification

Phase 1.5 can now apply tabu screening before acceptance.

- Tabu gating is active only when both `intensificationUseTabu` and
  `tabuSearchEnabled` are true.
- Tabu skips increment `phase15TabuSkips` and the general tabu hit counter.
- If Phase 1.5 accepts a move while tabu is active, the solver adds the
  previous current-state signature to the tabu list.

## Progress and telemetry

The telemetry subsystem combines structured logging with callback-based progress
reporting.

### Progress callback schedule

Progress callbacks can fire at these moments:

- once at iteration `0`,
- every `logging.logInterval` iterations,
- on forced reporting events such as reheating,
- at phase transitions indirectly when a forced report is triggered afterward.

`ProgressReporter` also suppresses duplicate callbacks for the same iteration.

### Progress payload

The callback receives five arguments:

```ts
(iteration, currentCost, temperature, state, stats)
```

The fourth argument, `state`, is always `null`.

### Failure semantics

If `onProgress` throws or rejects:

- the error is caught,
- the logger emits a warning,
- solving continues.

The callback is therefore observational, not mission critical.

### Diagnostics payload

The solver also records additive diagnostics that are returned in two places:
`solution.diagnostics` and `solver.getDiagnostics()`.

- `phaseTimings` measures elapsed runtime for Phase 1, Phase 1.5, Phase 2, and
  the total solve.
- `feasibility` records the hard-violation trajectory and the first-feasible
  milestone when one exists.
- `intensification` records attempts, accepted-move categories, tabu skips,
  local reheats, budget usage, and stop reasons.

These diagnostics are the most direct way to understand why Phase 1.5 did not
run, ran but stalled, or ran and ended by budget or early stop.

## Concurrency model

The solver is re-entrant at the process level but not at the instance level.

- Multiple solver instances can run independently.
- One solver instance cannot execute overlapping `solve()` calls.
- The guard is enforced with `isSolving` and raises
  `SolveConcurrencyError`.

## Determinism and reproducibility

The implementation uses `Math.random()` for operator selection, move acceptance,
and some targeting decisions. There is no built-in seeded RNG interface in the
current version.

As a result, reproducibility depends on external control of randomness or on
application-level determinism in move generators and constraints.

## Practical implications for advanced users

The code-level behavior suggests several design recommendations.

- Treat `evaluate()` as a satisfaction score, not a penalty score.
- Implement `getViolations()` for hard constraints when multiplicity matters.
- Provide `getStateSignature()` for large, non-serializable, or cyclic states.
- Name operators intentionally if you want Phase 1 heuristics to favor them.
- Use `'await'` progress mode only when callback ordering matters more than raw
  throughput.

## References

The implementation is consistent with the broader literature on simulated
annealing, tabu search, and stochastic local search, while remaining pragmatic
and domain-aware in its heuristics.

1. Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). Optimization by
   simulated annealing. *Science*, 220(4598), 671-680.
2. Glover, F. (1989). Tabu search—part I. *ORSA Journal on Computing*, 1(3),
   190-206.
3. Hoos, H. H., & Stutzle, T. (2004). *Stochastic Local Search: Foundations and
   Applications*. Morgan Kaufmann.

## Next steps

To connect this runtime view to the rest of the codebase:

- Read [Internal Architecture](/docs/architecture) for component boundaries and
  data flow.
- Read [API Reference](/docs/api-reference) for exact public type contracts.
- Read [Configuration](/docs/configuration) for parameter tuning guidance based
  on these rules.
