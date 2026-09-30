# DEF-208: The plan was ambiguous between nested and flat execution rows; nested shipped and the user has not confirmed it

| | |
|---|---|
| Kind | defect |
| Status | needs decision |
| Package | web |
| Found | 2026-09-30, walkthrough cases EX-02, EX-03 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "EX-02, EX-03", and `scrolls/walkthrough/features/05-web-execution-panel.md`, "Known open items"; 2026-09-30 |

## What is wrong

`scrolls/consolidated-plan-units.md:214-219` and `:536-541` (T2-9a worked example) do not say whether "the operation row carries the piece name once"
means real nesting or a flat list with only the first row full-named. The code implements the NESTED reading: indented child rows under a header
(`execution-panel-widget.tsx`). If the owner meant flat, EX-02 and EX-03 look wrong to them although they match the code.

## What should happen

Ask the user whether nested rows are what they meant. If flat, change the widget and its tests.

## Where to look

- `packages/web/src/widgets/execution-panel/execution-panel-widget.tsx`
- `scrolls/consolidated-plan-units.md:214-219,536-541`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
