# F105: loading `eslint.config.js` costs about 5 seconds per process

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P2: about 5 seconds of load cost in every lint and hook process |
| Package | eslint-plugin |
| Found | F104 |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

Loading `eslint.config.js` costs time in every process, most of it tsx transpiling eslint-plugin's rule source. Every hook integration worker and every lint process pays it, and it grows with each rule.

Measured 2026-09-30: about 5.2 s per process (2,333 modules from eslint-plugin's source). That is 75% of every hook integration file's cold start. The earlier figure was about 3.1 s.

## What should happen

Load eslint-plugin's compiled `dist` in `eslint.config.js` (keep source for ward's own lint of eslint-plugin), or lazy-import the heavy index brokers inside the rules that use them.

## Where to look

Root `eslint.config.js` and eslint-plugin's index brokers. Note the CLAUDE.md build rule: this config loads rules from source.

## History

Found by F104. The hooks pre-edit test was fixed around the cost, not through it. F106 cites this for the hooks warm-up timeout.
