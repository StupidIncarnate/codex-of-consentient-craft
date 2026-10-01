# DEF-80: `video stop` hands back a video file that is not finished and covers the whole session

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: `video stop` hands back an unfinished file of the wrong span |
| Package | siegelense |
| Found | 2026-09-28, walkthrough cases SL-102, SL-103 |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

`video stop` reports `video recording stopped — saved to .../video/<hash>.webm`, but the file is not finished. Playwright finalizes a recording only when its page closes.

Seen on 2026-09-28 (SL-102, SL-103, `inst_e4fc1619fe3d452bb5547f10cac0bd2e`, run_15): `video start`, two gotos, `video stop` reported `saved to .../video/250b84d5cebeee595c716f3f3289c394.webm`. The file is 6,815,744 bytes (exactly 26 x 262,144) and did not change in the 5 seconds after stop, so it is still unfinished. Earlier it was 1048576 bytes with a valid header and no seek index (Cues), and 262144 bytes right after stop.

Also, it is the only file in `video/`, and that folder dates from the instance's boot (17:39). So `stop` hands back the whole-session recording (about 9 minutes, every run), not a start-to-stop clip. `start` changes nothing because the context records from boot.

Code today: `browser-session-launch-broker.ts:625-640` sets `isRecording` and on stop returns `page.video().path()`; nothing closes the page or context.

## What should happen

`stop` finalizes a file covering only start to stop, and says its duration.

## Where to look

- `packages/siegelense/src/brokers/browser-session/launch/browser-session-launch-broker.ts:625-640` (`videoAction`; the old file was `playwright-session-adapter.ts`)
- `packages/siegelense/src/brokers/step/video/step-video-broker.ts`

One way: a per-`start` context with `recordVideo`, closed at `stop`. Another: ffmpeg.

## History

Path half fixed in `e062a1690`, built: `video stop` prints `.dungeonmaster-assets/siegelense-assets/.../video/<hash>.webm` (the repo-local symlink path). The `--kind video` prune half is fixed under DEF-88.
