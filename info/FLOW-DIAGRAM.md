# Orchestration Flow Diagram

## Sequential Flow (Old System)

```
START
  │
  ▼
Tasklord reads task
  │
  ▼
Spawn Coder ──────► Implements everything
  │                  (schema, types, code, tests)
  │
  ▼ (wait)
Spawn Reviewer ───► Reviews all code
  │
  │
  ▼ (wait)
Spawn QA ─────────► Creates .qa.ts files
  │
  │
  ▼ (wait)
Run tegrity
  │
  ├─ PASS ─► END
  │
  └─ FAIL ─► Spawn Fixer ─► END
```

## Optimized Parallel Flow (New System)

```
START
  │
  ▼
Tasklord reads task
  │
  ├─ Trivial? ─► Skip to Coder
  │
  ▼
Spawn Discovery ──► Creates discovery.json
  │                  (analyzes dependencies)
  │
  ▼
Schema needed? ───► Spawn SchemaAgent ──► Run migrations
  │                                        │
  │                                        ▼
Type needed? ─────► Spawn TypesAgent ──► Create types
  │                                        │
  │                                        ▼
  └─────────────────────────────────────►─┤
                                          │
                    ┌─────────────────────┤
                    │                     │
                    ▼                     ▼
        ┌─► Spawn Coder-1      Spawn Coder-2 ◄─┐
        │   (Service A)        (Service B)      │
        │          │                  │         │
        │          └────────┬─────────┘         │
        │                   ▼                   │
        │           (wait for all)              │
        │                   │                   │
PARALLEL│                   ▼                   │PARALLEL
        │           Spawn Reviewer              │
        │           (reviews all)               │
        │                   │                   │
        │                   ▼                   │
        │                   │                   │
        └─► Spawn Test-1    │    Spawn Test-2 ◄─┘
            (Integration A) │    (Integration B)
                    │       │       │
                    └───────┴───────┘
                            │
                            ▼
                      Run tegrity
                            │
                    ├─ PASS ─► END
                    │
                    └─ FAIL ─► Spawn Fixer ─► END
```

## File Coordination

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ discovery.json  │────►│ checkpoint.json  │────►│ task-status.md  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        │                        │                         │
   Dependency              Current State              Progress Log
     Mapping                 Tracking                  (Append-only)
        │                        │                         │
        ▼                        ▼                         ▼
   Enables                 Enables                    Historical
  Parallelism             Resumption                   Record
```

## Parallel Execution Example

```
Time →

T0: Discovery analyzes task
T1: SchemaAgent creates migrations
T2: Migrations run, TypesAgent creates types
T3: ┌─ Coder-1 starts ─┬─ Coder-2 starts ─┬─ Coder-3 starts ─┐
    │  (2 hours)       │  (2 hours)       │  (2 hours)       │
T5: └─ Coder-1 done ───┴─ Coder-2 done ───┴─ Coder-3 done ───┘
T6: CodeReviewer reviews all (1 hour)
T7: ┌─ Test-1 starts ──┬─ Test-2 starts ──┬─ Test-3 starts ──┐
    │  (1 hour)        │  (1 hour)        │  (1 hour)        │
T8: └─ Test-1 done ────┴─ Test-2 done ────┴─ Test-3 done ────┘
T9: Tegrity & complete

Total: 9 hours (vs 15 hours sequential)
```

## Decision Points

```
         ┌─────────────────┐
         │ Read Task File  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Trivial Task?   │
         │ (<3 files)      │
         └────┬──────┬─────┘
              │      │
         No ◄─┘      └─► Yes
          │                │
          ▼                ▼
    ┌───────────┐    ┌───────────┐
    │ Discovery │    │  Coder    │
    │  Agent    │    │  Direct   │
    └─────┬─────┘    └───────────┘
          │
          ▼
    ┌───────────┐
    │  Read     │
    │discovery  │
    │  .json    │
    └─────┬─────┘
          │
    ┌─────┴─────┬───────┬────────┐
    │           │       │        │
    ▼           ▼       ▼        ▼
 Schema?    Types?  Multiple  Single
                    Services? Service
```

## State Management

```
checkpoint.json maintains:

{
  "phases_complete": {
    "discovery": ✓,
    "schema": ✓,
    "types": ✓,
    "implementation": ◐  ← Current phase
  },
  "agents_active": [
    "Coder-1: working",
    "Coder-2: working"
  ]
}

Enables optimal restart after interruption
```
