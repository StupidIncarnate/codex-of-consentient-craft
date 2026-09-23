/**
 * PURPOSE: Drives `SiegelensePruneLayerFlow` through `prune`'s whole argv surface against a real
 * `installTestbedCreateBroker` evidence tree — nothing mocked. `flows/` may import neither
 * `brokers/` nor a `.proxy.ts` (`enforce-import-dependencies`, `enforce-test-proxy-imports`), so
 * every fixture here is written straight to disk through `testbed.writeFile`, including
 * `registry.json` itself, rather than through `registryWriteBroker`. Covers every `--kind` value
 * (`prune-instance-reclaim-broker.test.ts` only ever proved `shot`), `--instance` scoping, a live
 * instance's immunity, a citation refusal naming real paths, `--older-than` on both sides of the age
 * boundary, and the `--json`/rendered branches. Most sweeps below need only a fresh-versus-window
 * comparison, which needs no real age gap: every selecting sweep uses `0s`, "everything up to this
 * instant", against evidence the suite just wrote; the boundary case pairs that same fresh evidence
 * against a deliberately huge window (`1d`) on the other side, proving the comparison both ways
 * without waiting real time (which the pre-edit lint hook also refuses here — no `setTimeout` in a
 * test).
 *
 * `--kind video` with no `--older-than` is proven on a real 3-day-old `.webm`, backdated through
 * `evidenceAgeHarness` (`test/harnesses/evidence-age/`) — older than the 2d window `cleanup` uses
 * for video, younger than the shared 7d default `pruneArgsParseTransformer` resolves to, so the
 * file SURVIVING the sweep is proof the default is 7d, not merely of what the transformer parsed.
 * Both levels are asserted, so the parsed value and the disk outcome cannot silently disagree.
 *
 * USAGE:
 * await SiegelensePruneLayerFlow({ callArgs: ['--kind', 'shot', '--older-than', '0s'] });
 * // Deletes every shot past the window and returns { success: true }
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  FileContentStub,
  RelativePathStub,
} from '@dungeonmaster/testing';
import {
  AbsoluteFilePathStub,
  ContentTextStub,
  GuildIdStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  SiegeInstanceIdStub,
  SiegeRunIdStub,
} from '@dungeonmaster/shared/contracts';

import { evidenceAgeHarness } from '../../../test/harnesses/evidence-age/evidence-age.harness';
import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../contracts/registry/registry.stub';
import { pruneArgsParseTransformer } from '../../transformers/prune-args-parse/prune-args-parse-transformer';
import { SiegelensePruneLayerFlow } from './siegelense-prune-layer-flow';

const DAY_MS = 86_400_000;

const LOG_KIND_ID = InstanceIdStub({ value: 'inst_a0000001' });
const SHOT_KIND_ID = InstanceIdStub({ value: 'inst_a0000002' });
const TRANSCRIPT_KIND_ID = InstanceIdStub({ value: 'inst_a0000003' });
const VIDEO_KIND_ID = InstanceIdStub({ value: 'inst_a0000004' });
const SCOPE_TARGET_ID = InstanceIdStub({ value: 'inst_b0000001' });
const SCOPE_NEIGHBOUR_ID = InstanceIdStub({ value: 'inst_b0000002' });
const LIVE_ID = InstanceIdStub({ value: 'inst_c0000001' });
const CITED_ID = InstanceIdStub({ value: 'inst_d0000001' });
const BOUNDARY_ID = InstanceIdStub({ value: 'inst_e0000001' });
const VIDEO_DEFAULT_WINDOW_ID = InstanceIdStub({ value: 'inst_f0000001' });
const GUILD = GuildIdStub({ value: 'b2c3d4e5-69de-4b2a-9c1f-112233445566' });
const QUEST = QuestIdStub({ value: 'prune-audit' });

// Distinct, prime-ish lengths per kind so a wrong file surviving (or a wrong one vanishing) cannot
// be mistaken for the right one by size alone.
const KIND_LOG_BODY = 'l'.repeat(101);
const KIND_TRANSCRIPT_BODY = 't'.repeat(103);
const KIND_SHOT_BODY = 's'.repeat(107);
const KIND_VIDEO_BODY = 'v'.repeat(109);
const SCOPE_TARGET_LOG_BODY = 'z'.repeat(256);
const SCOPE_NEIGHBOUR_LOG_BODY = 'n'.repeat(256);
const LIVE_LOG_BODY = 'a'.repeat(64);
const CITED_LOG_BODY = 'c'.repeat(64);
const CITED_TRANSCRIPT_BODY = '{}\n';
const BOUNDARY_LOG_BODY = 'b'.repeat(64);

const LOG_KIND_LOG_PATH = `siegelense/unowned/instances/${LOG_KIND_ID}/api-server.log`;
const LOG_KIND_TRANSCRIPT_PATH = `siegelense/unowned/instances/${LOG_KIND_ID}/console.jsonl`;
const LOG_KIND_SHOT_PATH = `siegelense/unowned/instances/${LOG_KIND_ID}/runs/run_1/step1.png`;
const LOG_KIND_VIDEO_PATH = `siegelense/unowned/instances/${LOG_KIND_ID}/runs/clip.webm`;

const SHOT_KIND_LOG_PATH = `siegelense/unowned/instances/${SHOT_KIND_ID}/api-server.log`;
const SHOT_KIND_TRANSCRIPT_PATH = `siegelense/unowned/instances/${SHOT_KIND_ID}/console.jsonl`;
const SHOT_KIND_SHOT_PATH = `siegelense/unowned/instances/${SHOT_KIND_ID}/runs/run_1/step1.png`;
const SHOT_KIND_VIDEO_PATH = `siegelense/unowned/instances/${SHOT_KIND_ID}/runs/clip.webm`;

const TRANSCRIPT_KIND_LOG_PATH = `siegelense/unowned/instances/${TRANSCRIPT_KIND_ID}/api-server.log`;
const TRANSCRIPT_KIND_TRANSCRIPT_PATH = `siegelense/unowned/instances/${TRANSCRIPT_KIND_ID}/console.jsonl`;
const TRANSCRIPT_KIND_SHOT_PATH = `siegelense/unowned/instances/${TRANSCRIPT_KIND_ID}/runs/run_1/step1.png`;
const TRANSCRIPT_KIND_VIDEO_PATH = `siegelense/unowned/instances/${TRANSCRIPT_KIND_ID}/runs/clip.webm`;

const VIDEO_KIND_LOG_PATH = `siegelense/unowned/instances/${VIDEO_KIND_ID}/api-server.log`;
const VIDEO_KIND_TRANSCRIPT_PATH = `siegelense/unowned/instances/${VIDEO_KIND_ID}/console.jsonl`;
const VIDEO_KIND_SHOT_PATH = `siegelense/unowned/instances/${VIDEO_KIND_ID}/runs/run_1/step1.png`;
const VIDEO_KIND_VIDEO_PATH = `siegelense/unowned/instances/${VIDEO_KIND_ID}/runs/clip.webm`;

const SCOPE_TARGET_LOG_PATH = `siegelense/unowned/instances/${SCOPE_TARGET_ID}/api-server.log`;
const SCOPE_NEIGHBOUR_LOG_PATH = `siegelense/unowned/instances/${SCOPE_NEIGHBOUR_ID}/api-server.log`;
const LIVE_LOG_PATH = `siegelense/unowned/instances/${LIVE_ID}/api-server.log`;
const CITED_LOG_PATH = `siegelense/guilds/${GUILD}/instances/${CITED_ID}/api-server.log`;
const CITED_TRANSCRIPT_PATH = `siegelense/guilds/${GUILD}/instances/${CITED_ID}/runs/run_1.jsonl`;
const CITED_QUEST_FILE_RELATIVE_PATH = `guilds/${GUILD}/quests/${QUEST}/quest.json`;
const CITED_PRELUDE_RELATIVE_PATH = 'cited-worktree/.quest-plans/path-1.md';
const BOUNDARY_LOG_PATH = `siegelense/unowned/instances/${BOUNDARY_ID}/api-server.log`;
const VIDEO_DEFAULT_WINDOW_VIDEO_PATH = `siegelense/unowned/instances/${VIDEO_DEFAULT_WINDOW_ID}/runs/clip.webm`;
const VIDEO_DEFAULT_WINDOW_BODY = 'd'.repeat(113);

const REGISTRY_PATH = 'siegelense/registry.json';

const OPEN_ISSUE_GAP_WHY =
  'not checked: no issue record exists to check. Nothing in this repo stores an issue carrying ' +
  "a typed instanceId/runId — a workItem's own observation carries neither field and questNoteKindContract has " +
  'no issue member — so a walker records a defect as a failing test or as prose in a note, ' +
  'neither of which a resolver can match an instance against.';

const LAST_BEAT_PATTERN = /last beat \d+s ago/u;
const LAST_BEAT_PLACEHOLDER = 'last beat <n>s ago';

describe('SiegelensePruneLayerFlow', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'siegelense-prune-layer-flow' }),
  });
  const age = evidenceAgeHarness();
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  const citedQuestFileAbsPath = `${testbed.guildPath}/guilds/${GUILD}/quests/${QUEST}/quest.json`;
  const citedPreludeAbsPath = `${testbed.guildPath}/cited-worktree/.quest-plans/path-1.md`;

  let logKindResult: Awaited<ReturnType<typeof SiegelensePruneLayerFlow>> | null = null;
  let shotKindResult: Awaited<ReturnType<typeof SiegelensePruneLayerFlow>> | null = null;
  let transcriptKindResult: Awaited<ReturnType<typeof SiegelensePruneLayerFlow>> | null = null;
  let videoKindResult: Awaited<ReturnType<typeof SiegelensePruneLayerFlow>> | null = null;
  let targetAnswer: unknown = null;
  let citedAnswer: unknown = null;
  let liveRenderedOutput: ReturnType<typeof ContentTextStub> | null = null;
  let boundaryTooYoungAnswer: unknown = null;
  let boundaryPastWindowAnswer: unknown = null;
  let boundaryLogAfterTooYoungSweep: ReturnType<typeof testbed.readFile> = null;
  let videoDefaultWindowResult: Awaited<ReturnType<typeof SiegelensePruneLayerFlow>> | null = null;
  let videoDefaultWindowMtimeAfterBackdate: ReturnType<typeof EpochMsStub> | null = null;
  let videoDefaultWindowFileAfter: ReturnType<typeof testbed.readFile> = null;

  beforeAll(async () => {
    testbed.writeFile({
      relativePath: RelativePathStub({ value: REGISTRY_PATH }),
      content: FileContentStub({
        value: JSON.stringify(
          RegistryStub({
            instances: [
              RegistryEntryStub({ id: LOG_KIND_ID, state: 'killed', questId: null, guildId: null }),
              RegistryEntryStub({
                id: SHOT_KIND_ID,
                state: 'killed',
                questId: null,
                guildId: null,
              }),
              RegistryEntryStub({
                id: TRANSCRIPT_KIND_ID,
                state: 'killed',
                questId: null,
                guildId: null,
              }),
              RegistryEntryStub({
                id: VIDEO_KIND_ID,
                state: 'killed',
                questId: null,
                guildId: null,
              }),
              RegistryEntryStub({
                id: SCOPE_TARGET_ID,
                state: 'killed',
                questId: null,
                guildId: null,
              }),
              RegistryEntryStub({
                id: SCOPE_NEIGHBOUR_ID,
                state: 'killed',
                questId: null,
                guildId: null,
              }),
              RegistryEntryStub({
                id: LIVE_ID,
                state: 'alive',
                questId: null,
                guildId: null,
                reservedAtMs: EpochMsStub({ value: Date.now() - 120_000 }),
                bootedAtMs: EpochMsStub({ value: Date.now() - 120_000 }),
                lastBeatMs: EpochMsStub({ value: Date.now() - 2_000 }),
              }),
              RegistryEntryStub({ id: CITED_ID, state: 'killed', questId: QUEST, guildId: GUILD }),
              RegistryEntryStub({
                id: BOUNDARY_ID,
                state: 'killed',
                questId: null,
                guildId: null,
              }),
              RegistryEntryStub({
                id: VIDEO_DEFAULT_WINDOW_ID,
                state: 'killed',
                questId: null,
                guildId: null,
              }),
            ],
          }),
        ),
      }),
    });

    // Every kind, on one instance apiece, so a sweep scoped to that instance and that kind proves
    // it takes ONLY the named kind — the other three stay put with their original bytes.
    for (const kindInstanceId of [LOG_KIND_ID, SHOT_KIND_ID, TRANSCRIPT_KIND_ID, VIDEO_KIND_ID]) {
      testbed.writeFile({
        relativePath: RelativePathStub({
          value: `siegelense/unowned/instances/${kindInstanceId}/api-server.log`,
        }),
        content: FileContentStub({ value: KIND_LOG_BODY }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({
          value: `siegelense/unowned/instances/${kindInstanceId}/console.jsonl`,
        }),
        content: FileContentStub({ value: KIND_TRANSCRIPT_BODY }),
      });
      // The `run_1` directory itself is what makes `run_1` a real run id — no `run_1.jsonl` needed.
      testbed.writeFile({
        relativePath: RelativePathStub({
          value: `siegelense/unowned/instances/${kindInstanceId}/runs/run_1/step1.png`,
        }),
        content: FileContentStub({ value: KIND_SHOT_BODY }),
      });
      // A bare `.webm` directly under `runs/` — the video path `cleanup`'s own fixed sweep never
      // exercises, since nothing else in this repo writes one yet.
      testbed.writeFile({
        relativePath: RelativePathStub({
          value: `siegelense/unowned/instances/${kindInstanceId}/runs/clip.webm`,
        }),
        content: FileContentStub({ value: KIND_VIDEO_BODY }),
      });
    }

    testbed.writeFile({
      relativePath: RelativePathStub({ value: SCOPE_TARGET_LOG_PATH }),
      content: FileContentStub({ value: SCOPE_TARGET_LOG_BODY }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: SCOPE_NEIGHBOUR_LOG_PATH }),
      content: FileContentStub({ value: SCOPE_NEIGHBOUR_LOG_BODY }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: LIVE_LOG_PATH }),
      content: FileContentStub({ value: LIVE_LOG_BODY }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: BOUNDARY_LOG_PATH }),
      content: FileContentStub({ value: BOUNDARY_LOG_BODY }),
    });

    // A real `.webm`, backdated 3 real days through `evidenceAgeHarness` — older than cleanup's 2d
    // video window, younger than the shared 7d default, so which one survives says which window
    // `prune --kind video` with no `--older-than` actually resolves to.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: VIDEO_DEFAULT_WINDOW_VIDEO_PATH }),
      content: FileContentStub({ value: VIDEO_DEFAULT_WINDOW_BODY }),
    });
    const videoDefaultWindowAbsolutePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/${VIDEO_DEFAULT_WINDOW_VIDEO_PATH}`,
    });
    await age.backdateFile({ filePath: videoDefaultWindowAbsolutePath, daysOld: 3 });
    videoDefaultWindowMtimeAfterBackdate = await age.mtimeMs({
      filePath: videoDefaultWindowAbsolutePath,
    });

    // The cited instance: a quest-owned tree with a real log, a real run (so the prelude has a run
    // id to cite), a real open quest carrying a WALKED note, and a real `.quest-plans/` prelude.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: CITED_LOG_PATH }),
      content: FileContentStub({ value: CITED_LOG_BODY }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: CITED_TRANSCRIPT_PATH }),
      content: FileContentStub({ value: CITED_TRANSCRIPT_BODY }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: CITED_QUEST_FILE_RELATIVE_PATH }),
      content: FileContentStub({
        value: JSON.stringify(
          QuestStub({
            id: QUEST,
            status: 'in_progress',
            worktreePath: AbsoluteFilePathStub({ value: `${testbed.guildPath}/cited-worktree` }),
            planningNotes: {
              blightLedger: [],
              operationPlans: [],
              questNotes: [
                QuestNoteStub({
                  id: 'walked-prune-audit' as never,
                  kind: 'walked',
                  instanceId: SiegeInstanceIdStub({ value: String(CITED_ID) }),
                  runId: SiegeRunIdStub({ value: 'run_1' }),
                }),
              ],
            },
          }),
        ),
      }),
    });
    testbed.writeFile({
      relativePath: RelativePathStub({ value: CITED_PRELUDE_RELATIVE_PATH }),
      content: FileContentStub({
        value: '# PATH 1\n  VERIFIED  run_1 · 2026-09-21 · prelude reached the entry\n',
      }),
    });

    // Sweep every kind-matrix instance concurrently — each is its own instance, so none depends on
    // another's outcome.
    [
      logKindResult,
      shotKindResult,
      transcriptKindResult,
      videoKindResult,
      videoDefaultWindowResult,
    ] = await Promise.all([
      SiegelensePruneLayerFlow({
        callArgs: ['--instance', String(LOG_KIND_ID), '--kind', 'log', '--older-than', '0s'],
      }),
      SiegelensePruneLayerFlow({
        callArgs: ['--instance', String(SHOT_KIND_ID), '--kind', 'shot', '--older-than', '0s'],
      }),
      SiegelensePruneLayerFlow({
        callArgs: [
          '--instance',
          String(TRANSCRIPT_KIND_ID),
          '--kind',
          'transcript',
          '--older-than',
          '0s',
        ],
      }),
      SiegelensePruneLayerFlow({
        callArgs: ['--instance', String(VIDEO_KIND_ID), '--kind', 'video', '--older-than', '0s'],
      }),
      // No `--older-than` here — this is the one sweep proving what the DEFAULT resolves to.
      SiegelensePruneLayerFlow({
        callArgs: ['--instance', String(VIDEO_DEFAULT_WINDOW_ID), '--kind', 'video'],
      }),
    ]);
    videoDefaultWindowFileAfter = testbed.readFile({
      relativePath: RelativePathStub({ value: VIDEO_DEFAULT_WINDOW_VIDEO_PATH }),
    });

    // Stdout captures below run one at a time — overriding `process.stdout.write` mid-flight is
    // not safe to parallelise across calls sharing the same global.
    const targetWrites: ReturnType<typeof ContentTextStub>[] = [];
    const targetOriginalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string): boolean => {
      targetWrites.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;
    await SiegelensePruneLayerFlow({
      callArgs: ['--instance', String(SCOPE_TARGET_ID), '--older-than', '0s', '--json'],
    });
    process.stdout.write = targetOriginalWrite;
    const [targetWholeOutput] = targetWrites;
    targetAnswer = JSON.parse(String(targetWholeOutput));

    const citedWrites: ReturnType<typeof ContentTextStub>[] = [];
    const citedOriginalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string): boolean => {
      citedWrites.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;
    await SiegelensePruneLayerFlow({
      callArgs: ['--instance', String(CITED_ID), '--older-than', '0s', '--json'],
    });
    process.stdout.write = citedOriginalWrite;
    const [citedWholeOutput] = citedWrites;
    citedAnswer = JSON.parse(String(citedWholeOutput));

    const liveWrites: ReturnType<typeof ContentTextStub>[] = [];
    const liveOriginalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string): boolean => {
      liveWrites.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;
    await SiegelensePruneLayerFlow({
      callArgs: ['--instance', String(LIVE_ID), '--older-than', '0s'],
    });
    process.stdout.write = liveOriginalWrite;
    const [liveWholeOutput] = liveWrites;
    liveRenderedOutput = liveWholeOutput ?? null;

    // The boundary: the SAME freshly-written evidence, checked against a threshold on each side —
    // a huge window (`1d`) that cannot possibly select it, and `0s` which always does. No adapter
    // here backdates an mtime and the pre-edit lint hook refuses `setTimeout` in a test, so this is
    // the honest way to prove the comparison both ways.
    const boundaryTooYoungWrites: ReturnType<typeof ContentTextStub>[] = [];
    const boundaryTooYoungOriginalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string): boolean => {
      boundaryTooYoungWrites.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;
    await SiegelensePruneLayerFlow({
      callArgs: ['--instance', String(BOUNDARY_ID), '--older-than', '1d', '--json'],
    });
    process.stdout.write = boundaryTooYoungOriginalWrite;
    const [boundaryTooYoungWholeOutput] = boundaryTooYoungWrites;
    boundaryTooYoungAnswer = JSON.parse(String(boundaryTooYoungWholeOutput));
    // Captured HERE, between the two sweeps — by the time any `it()` runs, the second sweep below
    // (`0s`) has already taken the file, so reading current disk state from an `it()` would always
    // see the post-both-sweeps outcome regardless of which sweep it means to check.
    boundaryLogAfterTooYoungSweep = testbed.readFile({
      relativePath: RelativePathStub({ value: BOUNDARY_LOG_PATH }),
    });

    const boundaryPastWindowWrites: ReturnType<typeof ContentTextStub>[] = [];
    const boundaryPastWindowOriginalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string): boolean => {
      boundaryPastWindowWrites.push(ContentTextStub({ value: chunk }));
      return true;
    }) as unknown as typeof process.stdout.write;
    await SiegelensePruneLayerFlow({
      callArgs: ['--instance', String(BOUNDARY_ID), '--older-than', '0s', '--json'],
    });
    process.stdout.write = boundaryPastWindowOriginalWrite;
    const [boundaryPastWindowWholeOutput] = boundaryPastWindowWrites;
    boundaryPastWindowAnswer = JSON.parse(String(boundaryPastWindowWholeOutput));
  }, 60_000);

  afterAll(() => {
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });

  describe('--kind filters to exactly that kind', () => {
    it('VALID: {kind: log} => removes only the log asset, leaving shot, transcript and video on disk', () => {
      const logAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: LOG_KIND_LOG_PATH }),
      });
      const transcriptAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: LOG_KIND_TRANSCRIPT_PATH }),
      });
      const shotAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: LOG_KIND_SHOT_PATH }),
      });
      const videoAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: LOG_KIND_VIDEO_PATH }),
      });

      expect(logKindResult).toStrictEqual({ success: true });
      expect(logAfter).toBe(null);
      expect(transcriptAfter).toBe(KIND_TRANSCRIPT_BODY);
      expect(shotAfter).toBe(KIND_SHOT_BODY);
      expect(videoAfter).toBe(KIND_VIDEO_BODY);
    });

    it('VALID: {kind: shot} => removes only the shot asset, leaving log, transcript and video on disk', () => {
      const logAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: SHOT_KIND_LOG_PATH }),
      });
      const transcriptAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: SHOT_KIND_TRANSCRIPT_PATH }),
      });
      const shotAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: SHOT_KIND_SHOT_PATH }),
      });
      const videoAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: SHOT_KIND_VIDEO_PATH }),
      });

      expect(shotKindResult).toStrictEqual({ success: true });
      expect(logAfter).toBe(KIND_LOG_BODY);
      expect(transcriptAfter).toBe(KIND_TRANSCRIPT_BODY);
      expect(shotAfter).toBe(null);
      expect(videoAfter).toBe(KIND_VIDEO_BODY);
    });

    it('VALID: {kind: transcript} => removes only the transcript asset, leaving log, shot and video on disk', () => {
      const logAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: TRANSCRIPT_KIND_LOG_PATH }),
      });
      const transcriptAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: TRANSCRIPT_KIND_TRANSCRIPT_PATH }),
      });
      const shotAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: TRANSCRIPT_KIND_SHOT_PATH }),
      });
      const videoAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: TRANSCRIPT_KIND_VIDEO_PATH }),
      });

      expect(transcriptKindResult).toStrictEqual({ success: true });
      expect(logAfter).toBe(KIND_LOG_BODY);
      expect(transcriptAfter).toBe(null);
      expect(shotAfter).toBe(KIND_SHOT_BODY);
      expect(videoAfter).toBe(KIND_VIDEO_BODY);
    });

    it('VALID: {kind: video} => removes only the video asset, leaving log, shot and transcript on disk', () => {
      const logAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: VIDEO_KIND_LOG_PATH }),
      });
      const transcriptAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: VIDEO_KIND_TRANSCRIPT_PATH }),
      });
      const shotAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: VIDEO_KIND_SHOT_PATH }),
      });
      const videoAfter = testbed.readFile({
        relativePath: RelativePathStub({ value: VIDEO_KIND_VIDEO_PATH }),
      });

      expect(videoKindResult).toStrictEqual({ success: true });
      expect(logAfter).toBe(KIND_LOG_BODY);
      expect(transcriptAfter).toBe(KIND_TRANSCRIPT_BODY);
      expect(shotAfter).toBe(KIND_SHOT_BODY);
      expect(videoAfter).toBe(null);
    });
  });

  describe('--kind video with no --older-than', () => {
    it('VALID: {callArgs: [--kind, video]} => pruneArgsParseTransformer resolves the shared 7d window, never the 2d window cleanup uses for video', () => {
      const parsed = pruneArgsParseTransformer({ args: ['--kind', 'video'] });

      expect(String(parsed.query.olderThan)).toBe('7d');
    });

    it('VALID: {a real .webm backdated 3 days} => the backdating actually moved the mtime, roughly 3 days into the past', () => {
      const ageMs = Date.now() - Number(videoDefaultWindowMtimeAfterBackdate);

      expect(ageMs).toBeGreaterThan(DAY_MS * 2.5);
      expect(ageMs).toBeLessThan(DAY_MS * 3.5);
    });

    it('VALID: {--instance the video-default instance, --kind video, no --older-than} => the sweep itself succeeds', () => {
      expect(videoDefaultWindowResult).toStrictEqual({ success: true });
    });

    it('VALID: {the same sweep} => the 3-day-old video survives on disk, byte for byte — proof the default is 7d, since a 2d window would have taken it', () => {
      expect(videoDefaultWindowFileAfter).toBe(VIDEO_DEFAULT_WINDOW_BODY);
    });
  });

  describe('--instance scoping', () => {
    it('VALID: {--instance the target, --older-than 0s, --json} => the target alone is reported, tombstoned, with the real bytes its tree held', () => {
      expect(targetAnswer).toStrictEqual({
        freedMB: 0,
        freedBytes: 256,
        removed: [
          {
            id: String(SCOPE_TARGET_ID),
            kind: null,
            freedBytes: 256,
            freedMB: 0,
            tombstoned: true,
          },
        ],
        refused: [],
        unresolved: [],
      });
    });

    it('VALID: {the target sweep} => the target log is gone from disk', () => {
      const after = testbed.readFile({
        relativePath: RelativePathStub({ value: SCOPE_TARGET_LOG_PATH }),
      });

      expect(after).toBe(null);
    });

    it('VALID: {the target sweep} => the neighbouring instance still has its log, byte for byte', () => {
      const after = testbed.readFile({
        relativePath: RelativePathStub({ value: SCOPE_NEIGHBOUR_LOG_PATH }),
      });

      expect(after).toBe(SCOPE_NEIGHBOUR_LOG_BODY);
    });
  });

  describe('a live instance', () => {
    it('VALID: {--instance the live one, --older-than 0s} => refused by name, rendered, because the window is not what protects it', () => {
      const normalized = String(liveRenderedOutput).replace(
        LAST_BEAT_PATTERN,
        LAST_BEAT_PLACEHOLDER,
      );

      expect(normalized).toBe(
        'FREED: 0MB (0 bytes)\n' +
          'REMOVED: none\n' +
          `REFUSED: ${String(LIVE_ID)} (live — ${LAST_BEAT_PLACEHOLDER})\n` +
          'NOT CHECKED: none\n',
      );
    });

    it('VALID: {the live instance} => its log is untouched whatever the window said', () => {
      const after = testbed.readFile({ relativePath: RelativePathStub({ value: LIVE_LOG_PATH }) });

      expect(after).toBe(LIVE_LOG_BODY);
    });
  });

  describe('a cited instance', () => {
    it('VALID: {--instance the cited one, --older-than 0s, --json} => refused, and the sentence carries the real quest file, the real prelude path and the real run id', () => {
      expect(citedAnswer).toStrictEqual({
        freedMB: 0,
        freedBytes: 0,
        removed: [],
        refused: [
          {
            id: String(CITED_ID),
            why:
              `run_1 cited by a WALKED note on open quest ${String(QUEST)} (in_progress) in ` +
              `${citedQuestFileAbsPath}; run_1 cited by a VERIFIED prelude in ${citedPreludeAbsPath}`,
          },
        ],
        unresolved: [{ kind: 'open-issue', why: OPEN_ISSUE_GAP_WHY }],
      });
    });

    it('VALID: {the cited instance} => its log is still on disk after the refusal', () => {
      const after = testbed.readFile({ relativePath: RelativePathStub({ value: CITED_LOG_PATH }) });

      expect(after).toBe(CITED_LOG_BODY);
    });
  });

  describe('--older-than on each side of the age boundary', () => {
    it('VALID: {--older-than 1d, against evidence written moments ago} => nothing selected and the log stays on disk', () => {
      expect(boundaryTooYoungAnswer).toStrictEqual({
        freedMB: 0,
        freedBytes: 0,
        removed: [],
        refused: [],
        unresolved: [],
      });
      expect(boundaryLogAfterTooYoungSweep).toBe(BOUNDARY_LOG_BODY);
    });

    it('VALID: {--older-than 0s, the same evidence} => selected and genuinely gone from disk', () => {
      const after = testbed.readFile({
        relativePath: RelativePathStub({ value: BOUNDARY_LOG_PATH }),
      });

      expect(boundaryPastWindowAnswer).toStrictEqual({
        freedMB: 0,
        freedBytes: 64,
        removed: [
          { id: String(BOUNDARY_ID), kind: null, freedBytes: 64, freedMB: 0, tombstoned: true },
        ],
        refused: [],
        unresolved: [],
      });
      expect(after).toBe(null);
    });
  });
});
