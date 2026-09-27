# <ID>: <title, a plain statement of the end state>

| | |
|---|---|
| Phase | <phase name from EPIC.md> |
| Source | <source doc path, section name, item number, and line range> |
| Needs | <IDs, each linked to its file, or "nothing"> |
| Unblocks | <IDs this item is a "Needs" of> |
| Packages touched | <workspace package names> |
| Checks to run | <ward check types, e.g. `lint,typecheck,unit`> |
| Split | <"one agent", or how the operator splits it: by package, by folder, 2 to 4 files per agent> |
| Runs alone | <"no", or why it must run with no other agent in its packages> |

## Why

<Two to six sentences: what is wrong today and what it costs. Copied or condensed from the source doc,
keeping every figure and file name.>

## Current state

<What the code holds today, with paths. Figures from the source doc keep their date. Mark anything not
yet checked against the code.>

## Work

<Numbered steps. Copy the source doc's rule text, examples, tables and flagged/left-alone code blocks
that the agent needs; an agent should not need to open the source doc to do the job. Apply EPIC.md's
concessions to every example: a stub or proxy is imported from its own file, such as
`#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy` or
`@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`. There is no `_test_` path.>

## Lint rules this item adds or changes

<Omit this section when there are none. For each rule: name, what it refuses, its message, whether it
runs pre-edit (and why), and its autofix if any.>

## Teaching text this item changes

<Omit when none. Rows copied from the source doc's docs tables: where, says today, change to.>

## Done when

<A checklist a machine or a reviewer can verify: files gone, rule on, ward command exits 0.>

## Traps

<Known gotchas from the source docs and CLAUDE.md that apply here. Omit when none.>

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
