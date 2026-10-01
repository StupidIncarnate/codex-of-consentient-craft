# F63: the repo pins jest 30.2.0, which grades tests differently from consumers

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | cross-cutting |
| Found | F60 |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

This repo pins jest 30.2.0. Its `toStrictEqual` rejects Node-realm objects such as `response.json()`'s result. Consumers get jest 30.5.2, which accepts them. Repo and consumer grade the same test differently.

Checked 2026-09-30: root `package.json:105` still reads `"jest": "^30.0.4"`; the installed version is 30.2.0 (audit 2026-09-29).

## What should happen

Bump the repo's jest so repo and consumer grade tests the same way.

## Where to look

Root `package.json` line 105 (`jest`), then `package-lock.json`. The change is ready: it needs an operator `npm install` at a quiet point, nothing else. It is not blocked.

## History

Found by F60. Audit 2026-09-29 recorded the range and the installed version.
