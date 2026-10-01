# CHG-3: Siege memory storage: agents keep reminders of how to drive an app

| | |
|---|---|
| Kind | change |
| Status | ready |
| Priority | P3: a new feature that needs a design first |
| Package | siegelense |
| Found | 2026-09-30, the user's decision on DEF-213 |
| Moved from | DEF-213 (the driving-oddities code), 2026-09-30 |

## What to build

The user's words: "siege can store reminders of how to drive through an app", and the first attempt "needs a rearch".

A browser-driving agent (siegemaster, a walker, a fixer) often loses a round rediscovering the same fact about an app. For example: "clicking this label does nothing; click the wrapper", or "this route needs a seeded guild first". A quest's own notes are wiped when the quest ends. So nothing carries the fact to the next walk, in this repo or a consumer's.

Design the memory first, then build it. The design must answer:

- **Where it lives**, and whether it is committed. It must work in a consumer repo, whose app nobody here knows.
- **How an agent reads it** before driving, and at what cost to its context.
- **How an agent adds to it**, and how a wrong or stale entry gets corrected or removed.
- **What an entry is keyed by**: a test id, a route, a flow, or free text.
- **How it differs from a defect.** A reminder that is really a bug belongs on the bounty board, not in the memory.

## Where to look

- The first attempt, deleted under DEF-213: commit `7c5ab8f7c` (`drivingOddityContract`, `drivingOddityAppendBroker`, `drivingOddityReadBroker`), with its reasoning in their PURPOSE headers
- The siegelense docs an agent reads before driving: `dungeonmaster siegelense docs --for walking`
- `scrolls/seigelense/` for the siegelense design
- CHG-4, `orchestrator/CHG-4-plan-names-test-data-setup.md`: how a plan names each browser test's data setup, part of the same re-architecture

## History

The first attempt (2026-09-22) built only a read and an append broker for `.dungeonmaster-assets/driving-oddities.jsonl`; nothing ever called them. The user chose a redesign over wiring it up.
