---
title: "Documentation"
description: "Complete technical documentation for `timetable-sa` - a production-grade, generic Simulated Annealing optimization library for TypeScript."
---

# Documentation

Complete technical documentation for `timetable-sa` - a production-grade, generic Simulated Annealing optimization library for TypeScript.

## Overview

This documentation provides comprehensive coverage of the `timetable-sa` package, organized to support practitioners at all levels—from first-time users to advanced researchers implementing domain-specific optimization systems. The reference sections are aligned with the current implementation in `src/` so the docs can be used as an operational source of truth, not only as conceptual guidance.

### Documentation Philosophy

this documentation prioritizes:

- **Completeness**: Every public API, configuration option, and internal mechanism documented
- **Precision**: Technical accuracy with mathematical formalism where appropriate
- **Practicality**: Working examples, configuration profiles, and troubleshooting guidance
- **Extensibility**: Clear extension points for custom constraints, move
  generators, policies, and diagnostics-driven tuning

## Documentation Workflows

The documentation is structured around three primary user journeys:

### 1. Learn

Get started with the fundamentals and build your first working optimizer.

- **[Introduction](/docs/introduction)** - Library overview, capabilities, and design philosophy
- **[Installation](/docs/installation)** - Setup instructions for Node.js and Bun environments
- **[Quick Start](/docs/quickstart)** - Complete 5-step walkthrough from state to solution
- **[Core Concepts](/docs/core-concepts)** - Essential concepts: constraints, moves, fitness, phases, tabu search

**Time to first solution**: ~15 minutes

### 2. Configure

Tune solver behavior for production workloads and specific problem domains.

- **[Configuration Guide](/docs/configuration)** - Complete configuration reference with tuning strategies
- **[Algorithm and Runtime Behavior](/docs/advanced-features)** - Deep dive into phase lifecycles, acceptance rules, diagnostics, and reheating
- **[Examples](/docs/examples)** - Domain-specific implementations and patterns
- **[Testing Guide](/docs/testing-guide)** - Comprehensive testing strategies for constraints, moves, and solver configurations

**Recommended for**: Production deployments, performance tuning, custom implementations

### 3. Integrate

Understand internals for advanced customization and system integration.

- **[Internal Architecture](/docs/architecture)** - System design, component interactions, and extension points
- **[API Reference](/docs/api-reference)** - Complete API documentation with TypeScript signatures
- **[Migration Guide](/docs/migration-guide)** - Version migration instructions
- **[Troubleshooting](/docs/troubleshooting)** - Common issues and diagnostic procedures

**Recommended for**: Library contributors, framework builders, research applications

## Quick Navigation

### By Task

| Task | Documentation |
|------|---------------|
| First-time setup | [Installation](/docs/installation) → [Quick Start](/docs/quickstart) |
| Understanding concepts | [Introduction](/docs/introduction) → [Core Concepts](/docs/core-concepts) |
| Configuring solver | [Configuration Guide](/docs/configuration) → [Advanced Features](/docs/advanced-features) |
| Writing constraints | [Core Concepts](/docs/core-concepts#constraints) → [API Reference](/docs/api-reference#constrainttstate) → [Testing Guide](/docs/testing-guide#unit-testing-constraints) |
| Writing move generators | [Core Concepts](/docs/core-concepts#move-generators) → [API Reference](/docs/api-reference#movegeneratortstate) → [Testing Guide](/docs/testing-guide#unit-testing-move-generators) |
| Testing implementation | [Testing Guide](/docs/testing-guide) |
| Debugging issues | [Troubleshooting](/docs/troubleshooting) |
| Optimizing performance | [Configuration Guide](/docs/configuration) → [Advanced Features](/docs/advanced-features) |
| Diagnosing solver behavior | [API Reference](/docs/api-reference) → [Troubleshooting](/docs/troubleshooting) |
| Understanding internals | [Internal Architecture](/docs/architecture) |
| API details | [API Reference](/docs/api-reference) |

### By Experience Level

**Beginner (New to optimization)**
1. [Introduction](/docs/introduction)
2. [Installation](/docs/installation)
3. [Quick Start](/docs/quickstart)
4. [Core Concepts](/docs/core-concepts)

**Intermediate (Building production systems)**
1. [Configuration Guide](/docs/configuration)
2. [Advanced Features](/docs/advanced-features)
3. [Testing Guide](/docs/testing-guide)
4. [Examples](/docs/examples)

**Advanced (Research and extension)**
1. [Internal Architecture](/docs/architecture)
2. [API Reference](/docs/api-reference)
3. Source code (TypeScript with comprehensive JSDoc)

## Reference Materials

### Configuration Profiles

Pre-configured parameter sets for common scenarios (from [Configuration Guide](/docs/configuration)):

- **Quick Start**: Rapid prototyping, small problems
- **Quality**: Production optimization, high-quality solutions
- **Fast**: Time-constrained scenarios
- **Custom**: User-defined parameters

### Mathematical Foundations

Key algorithms and mathematical concepts:

- **Simulated Annealing**: Boltzmann acceptance probability, geometric cooling
- **Tabu Search**: Short-term memory with aspiration criteria
- **Adaptive Operator Selection**: Hybrid and roulette-wheel strategies
- **Multi-phase Optimization**: Phase 1 (hard), Phase 1.5 (intensification), Phase 2 (soft)

See [Advanced Features](/docs/advanced-features) and [Internal Architecture](/docs/architecture) for formal specifications.

## Contributing to Documentation

When contributing to this documentation:

1. **Keep it accurate**: Test all code examples before submitting
2. **Be precise**: Use exact TypeScript types and API signatures
3. **Include context**: Explain *why*, not just *how*
4. **Maintain consistency**: Follow existing formatting and structure
5. **Consider the audience**: Tailor technical depth to the intended reader

## Document Conventions

### Code Examples

All code examples are:
- **Runnable**: Can be copied and executed with minimal modification
- **Complete**: Include necessary imports and type definitions
- **Type-safe**: Valid TypeScript with proper type annotations
- **Practical**: Derived from real-world use cases

### Mathematical Notation

Mathematical descriptions use:
- **Pseudocode**: Clear algorithmic descriptions
- **Formal notation**: Set theory, probability, and optimization notation where appropriate
- **Complexity analysis**: Big-O notation for performance characteristics

### Cross-References

Related documentation is linked:
- Inline links: `[Configuration Guide](/docs/configuration)`
- Section anchors: `[API Reference](/docs/api-reference#constrainttstate)`
- See also sections at document conclusions

## Getting Help

If you can't find what you need:

1. Check [Troubleshooting](/docs/troubleshooting) for common issues
2. Review [Examples](/docs/examples) for similar use cases
3. Read the source code (extensively commented JSDoc)

---

**Documentation Version**: 1.0.0  
**Last Updated**: March 2026  
**Maintainer**: Benjamin Naphtali
