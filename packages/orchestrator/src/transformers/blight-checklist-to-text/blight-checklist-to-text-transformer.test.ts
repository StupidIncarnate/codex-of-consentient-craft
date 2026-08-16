import {
  BlightChecklistItemStub,
  BlightChecklistStub,
  QuestBlightLedgerEntryStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';
import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { blightChecklistLimitsStatics } from '../../statics/blight-checklist-limits/blight-checklist-limits-statics';
import { blightConcernLegendStatics } from '../../statics/blight-concern-legend/blight-concern-legend-statics';
import { blightChecklistBuildTransformer } from '../blight-checklist-build/blight-checklist-build-transformer';
import { blightChecklistToTextTransformer } from './blight-checklist-to-text-transformer';

// A real quest in this repo touched 173 changed files; 170 impl groups crossed with every
// BlightConcern is 680 review units — the scale get-blight-checklist must actually render at.
// Realistic DEEP paths (this repo's own `packages/<pkg>/src/<folderType>/<domain>/<domain>-<suffix>.ts`
// convention), not short fake ones — a short-path fixture would pass this test while a real diff
// still overflows the MCP tool-result ceiling. Every SCALE_TEST_COMPANION_EVERY-th impl file also
// carries a `.test.ts` and a `.proxy.ts` in the changed-file list, so the fixture drives the
// companion-collapse that makes the group count smaller than the changed-file count — a fixture of
// bare impl paths never exercises it, and the unit count would be measured against the wrong number.
const SCALE_TEST_CHANGED_FILE_COUNT = 170;
const SCALE_TEST_COMPANION_EVERY = 10;
const SCALE_TEST_PACKAGE_NAMES = [
  'orchestrator',
  'web',
  'server',
  'mcp',
  'hooks',
  'shared',
  'cli',
  'ward',
  'tooling',
  'eslint-plugin',
];
// `contracts` is deliberately absent: a `-contract.ts` is declaration-shaped, so
// blightChecklistBuildTransformer withholds the concerns blightConcernGatingStatics names and the
// file crosses THREE concerns instead of five. These two scale tests measure the render at its most
// expensive, which is the ungated per-file shape — a fixture mixing both would measure a cheaper
// average and size the cap against a diff no real quest produces.
const SCALE_TEST_FOLDER_TYPES = [
  'brokers',
  'transformers',
  'widgets',
  'responders',
  'adapters',
  'guards',
  'bindings',
];
const SCALE_TEST_DOMAIN_STEMS = [
  'quest-blight-checklist',
  'agent-prompt-classification',
  'flow-evidence-contract',
  'work-item-to-prompt',
  'signal-back-responder',
  'orchestration-dispatch-loop',
  'quest-modify-lock-layer',
  'blight-checklist-build',
  'chat-line-process',
  'quest-status-input-allowlist',
  'operations-ledger-relay',
  'siegemaster-walker-minion',
];

describe('blightChecklistToTextTransformer', () => {
  describe('header', () => {
    it('VALID: {checklist} => names baseRef, pair count, unit count, and the remaining count', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          baseRef: 'a1b2c3d4',
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
            }),
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:perf',
              implPath: 'packages/a/a.ts',
              concern: 'perf',
            }),
          ],
          remainingItemIds: ['packages/a/a.ts:perf'],
        }),
      }).split('\n');

      expect(lines.slice(0, 4)).toStrictEqual([
        '# BLIGHT CHECKLIST — diff from `a1b2c3d4`',
        'Pairs: 1 changed file(s)',
        'Units: 2 (file × concern crossings)',
        'REMAINING (no disposition in quest.planningNotes.blightLedger): 1 of 2',
      ]);
    });

    it('VALID: {baseRef: "deadbeef"} => the exact baseRef is present in the output', () => {
      const text = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({ baseRef: 'deadbeef', items: [], remainingItemIds: [] }),
      });

      expect(text.split('\n')[0]).toBe('# BLIGHT CHECKLIST — diff from `deadbeef`');
    });
  });

  describe('id grammar', () => {
    it('VALID: {any checklist} => states the itemId grammar is the file heading plus the concern name', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({ items: [], remainingItemIds: [] }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith("A unit's itemId is"))).toBe(
        "A unit's itemId is <implPath>:<concern> — the file heading plus the concern name.",
      );
    });
  });

  describe('empty checklist', () => {
    it('VALID: {items: [], remainingItemIds: []} => renders without throwing and reports 0 of 0', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({ baseRef: 'a1b2c3d4', items: [], remainingItemIds: [] }),
      }).split('\n');

      expect(lines.slice(0, 4)).toStrictEqual([
        '# BLIGHT CHECKLIST — diff from `a1b2c3d4`',
        'Pairs: 0 changed file(s)',
        'Units: 0 (file × concern crossings)',
        'REMAINING (no disposition in quest.planningNotes.blightLedger): 0 of 0',
      ]);
    });
  });

  describe('disposition markers', () => {
    it('VALID: {one concern dispositioned, one remaining, same file} => concerns split across the [x] and [ ] lines', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
            }),
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:perf',
              implPath: 'packages/a/a.ts',
              concern: 'perf',
            }),
          ],
          remainingItemIds: ['packages/a/a.ts:perf'],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('    [x] '))).toBe('    [x] craft');
      expect(lines.find((line) => line.startsWith('    [ ] '))).toBe('    [ ] perf');
    });

    it('VALID: {three concerns dispositioned, one remaining, same file} => each line lists only its own concerns, in crossing order', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
            }),
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:perf',
              implPath: 'packages/a/a.ts',
              concern: 'perf',
            }),
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:dedup',
              implPath: 'packages/a/a.ts',
              concern: 'dedup',
            }),
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:integrity',
              implPath: 'packages/a/a.ts',
              concern: 'integrity',
            }),
          ],
          remainingItemIds: ['packages/a/a.ts:integrity'],
        }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('    [x] '))).toBe('    [x] craft perf dedup');
      expect(lines.find((line) => line.startsWith('    [ ] '))).toBe('    [ ] integrity');
    });

    it('VALID: {all concerns on a file dispositioned} => only the [x] line renders, no [ ] line', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('    [x] '))).toStrictEqual(['    [x] craft']);
      expect(lines.filter((line) => line.startsWith('    [ ] '))).toStrictEqual([]);
    });

    it('VALID: {all concerns on a file remaining} => only the [ ] line renders, no [x] line', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
            }),
          ],
          remainingItemIds: ['packages/a/a.ts:craft'],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('    [x] '))).toStrictEqual([]);
      expect(lines.filter((line) => line.startsWith('    [ ] '))).toStrictEqual(['    [ ] craft']);
    });

    it('VALID: {unit carrying a label} => the label text never renders, so a large diff stays under the tool-result ceiling', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
              label: "craft — a.ts's logic matches its signature",
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.some((line) => line.includes("a.ts's logic matches its signature"))).toBe(false);
    });

    it('VALID: {one unit per concern across 40 files} => renders one heading plus one [x] line per file, scaling linearly with file count', () => {
      const items = Array.from({ length: 40 }, (_, index) =>
        BlightChecklistItemStub({
          id: `packages/a/file-${String(index)}.ts:craft`,
          implPath: `packages/a/file-${String(index)}.ts`,
          concern: 'craft',
          pairedFiles: [],
        }),
      );

      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({ items, remainingItemIds: [] }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('### '))).toStrictEqual(
        Array.from(
          { length: 40 },
          (_, index) => `### packages/a/file-${String(index)}.ts  (+0 paired)`,
        ),
      );
      expect(lines.filter((line) => line.startsWith('    [x] '))).toStrictEqual(
        Array.from({ length: 40 }, () => '    [x] craft'),
      );
    });
  });

  describe('grouping by implPath', () => {
    it('VALID: {two concerns, same implPath, two paired files} => units group under one file heading naming the paired COUNT, not the paired files', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
              pairedFiles: ['packages/a/a.test.ts', 'packages/a/a.proxy.ts'],
            }),
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:perf',
              implPath: 'packages/a/a.ts',
              concern: 'perf',
              pairedFiles: ['packages/a/a.test.ts', 'packages/a/a.proxy.ts'],
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('### '))).toStrictEqual([
        '### packages/a/a.ts  (+2 paired)',
      ]);
      expect(lines.some((line) => line.includes('a.test.ts'))).toBe(false);
      expect(lines.some((line) => line.includes('a.proxy.ts'))).toBe(false);
    });

    it('VALID: {two distinct implPaths} => each gets its own file heading', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
              pairedFiles: [],
            }),
            BlightChecklistItemStub({
              id: 'packages/b/b.ts:craft',
              implPath: 'packages/b/b.ts',
              concern: 'craft',
              pairedFiles: [],
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('### '))).toStrictEqual([
        '### packages/a/a.ts  (+0 paired)',
        '### packages/b/b.ts  (+0 paired)',
      ]);
    });

    it('VALID: {no pairedFiles} => the heading states a zero paired count rather than omitting it', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:dedup',
              implPath: 'packages/a/a.ts',
              concern: 'dedup',
              pairedFiles: [],
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('### '))).toStrictEqual([
        '### packages/a/a.ts  (+0 paired)',
      ]);
    });
  });

  describe('concern legend', () => {
    it('VALID: {craft and perf present} => the legend lists only those two concerns, not all five', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
            }),
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:perf',
              implPath: 'packages/a/a.ts',
              concern: 'perf',
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('- '))).toStrictEqual([
        `- craft → ${blightConcernLegendStatics.byConcern.craft}`,
        `- perf → ${blightConcernLegendStatics.byConcern.perf}`,
      ]);
    });

    it('VALID: {no items} => the legend section is omitted from the section list', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({ items: [], remainingItemIds: [] }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('## '))).toStrictEqual([
        '## UNITS — [ ] no disposition yet, [x] already dispositioned in quest.planningNotes.blightLedger',
      ]);
    });

    it('VALID: {items present} => the legend section heading is included', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/a/a.ts:craft',
              implPath: 'packages/a/a.ts',
              concern: 'craft',
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => line.startsWith('## '))).toStrictEqual([
        '## CONCERN LEGEND (concerns present on this diff)',
        '## UNITS — [ ] no disposition yet, [x] already dispositioned in quest.planningNotes.blightLedger',
        '## NO DECLARED PACKAGE — 1 file(s)',
      ]);
    });
  });

  describe('package sections', () => {
    it('VALID: {files of two packages, interleaved} => one section per package, each holding only its own files', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'packages/web/a.tsx:craft',
              implPath: 'packages/web/a.tsx',
              concern: 'craft',
              packageName: 'web',
              pairedFiles: [],
            }),
            BlightChecklistItemStub({
              id: 'packages/server/s.ts:craft',
              implPath: 'packages/server/s.ts',
              concern: 'craft',
              packageName: 'server',
              pairedFiles: [],
            }),
            BlightChecklistItemStub({
              id: 'packages/web/b.tsx:craft',
              implPath: 'packages/web/b.tsx',
              concern: 'craft',
              packageName: 'web',
              pairedFiles: [],
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => /^(?:## PACKAGE|### )/u.test(line))).toStrictEqual([
        '## PACKAGE: web — 2 file(s)',
        '### packages/web/a.tsx  (+0 paired)',
        '### packages/web/b.tsx  (+0 paired)',
        '## PACKAGE: server — 1 file(s)',
        '### packages/server/s.ts  (+0 paired)',
      ]);
    });

    it('VALID: {a declared package plus files under none} => the undeclared files render in a trailing section of their own', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({
          items: [
            BlightChecklistItemStub({
              id: 'scripts/release.ts:craft',
              implPath: 'scripts/release.ts',
              concern: 'craft',
              pairedFiles: [],
            }),
            BlightChecklistItemStub({
              id: 'packages/web/a.tsx:craft',
              implPath: 'packages/web/a.tsx',
              concern: 'craft',
              packageName: 'web',
              pairedFiles: [],
            }),
          ],
          remainingItemIds: [],
        }),
      }).split('\n');

      expect(lines.filter((line) => /^## (?:PACKAGE|NO DECLARED)/u.test(line))).toStrictEqual([
        '## PACKAGE: web — 1 file(s)',
        '## NO DECLARED PACKAGE — 1 file(s)',
      ]);
    });

    it('VALID: {any checklist} => the header states files sit under the package that owns them', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({ items: [], remainingItemIds: [] }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('Files sit under'))).toBe(
        'Files sit under the package that owns them.',
      );
    });
  });

  describe('the definition-of-done statement', () => {
    it('VALID: {any checklist} => states the remaining count decides the signal, not recollection', () => {
      const lines = blightChecklistToTextTransformer({
        checklist: BlightChecklistStub({ items: [], remainingItemIds: [] }),
      }).split('\n');

      expect(lines.find((line) => line.startsWith('own disposition,'))).toBe(
        'own disposition, and the REMAINING count above decides the completion signal, not recollection.',
      );
    });
  });

  // GAP: the get-blight-checklist MCP tool is exempt from the mcp-server-flow size-cap suite
  // (that suite calls every tool with `arguments: {}`, and this tool requires a `questId`), so
  // its rendered size at real-quest scale has never actually been measured. Over
  // `mcpToolResultStatics.maxOutputTokens` the content is NOT delivered to the calling agent —
  // it is spilled to a file and the agent receives an error stub, which for this tool means the
  // reviewer-minion loses the REMAINING count its dispositions are measured against. This builds the
  // checklist the real transformer produces for a real-quest-sized diff and renders it through
  // the real text transformer, measuring the actual output — not a short-path stand-in.
  describe('scale — a real quest-sized diff', () => {
    it('VALID: {170 impl files at realistic deep repo paths, some with test+proxy companions, crossed with every concern} => companions collapse onto their impl, and rendered text stays under mcpToolResultStatics.maxVerbatimChars', () => {
      const { baseRef } = BlightChecklistStub();

      // One file's worth of units tells us how many concerns the real transformer crosses per
      // file, without importing the concern contract into this test file (banned — tests import
      // stubs, not raw contracts) and without hardcoding the count.
      const singleFileProbe = blightChecklistBuildTransformer({
        changedFiles: [
          RepoRelativePathStub({ value: 'packages/orchestrator/src/probe/probe-broker.ts' }),
        ],
        baseRef,
      });
      const concernsPerFile = singleFileProbe.items.length;

      const implFiles = Array.from({ length: SCALE_TEST_CHANGED_FILE_COUNT }, (_, index) => {
        const packageName = SCALE_TEST_PACKAGE_NAMES[index % SCALE_TEST_PACKAGE_NAMES.length]!;
        const folderType = SCALE_TEST_FOLDER_TYPES[index % SCALE_TEST_FOLDER_TYPES.length]!;
        const suffix = folderType.slice(0, -1);
        const domain = `${SCALE_TEST_DOMAIN_STEMS[index % SCALE_TEST_DOMAIN_STEMS.length]!}-${String(index)}`;
        return RepoRelativePathStub({
          value: `packages/${packageName}/src/${folderType}/${domain}/${domain}-${suffix}.ts`,
        });
      });
      const companionFiles = implFiles
        .filter((_implFile, index) => index % SCALE_TEST_COMPANION_EVERY === 0)
        .flatMap((implFile) => [
          RepoRelativePathStub({
            value: `${String(implFile).slice(0, -'.ts'.length)}.test.ts`,
          }),
          RepoRelativePathStub({
            value: `${String(implFile).slice(0, -'.ts'.length)}.proxy.ts`,
          }),
        ]);
      const changedFiles = [...implFiles, ...companionFiles];

      const checklist = blightChecklistBuildTransformer({ changedFiles, baseRef });
      const rendered = blightChecklistToTextTransformer({ checklist });
      const renderedLength = rendered.length;
      const lines = rendered.split('\n');
      const remainingLine = lines.find((line) => line.startsWith('REMAINING'));
      const groupCount = new Set(checklist.items.map((item) => String(item.implPath))).size;
      const unitCount = checklist.items.length;
      const expectedUnitCount = groupCount * concernsPerFile;
      const firstImplBase = String(implFiles[0]!).slice(0, -'.ts'.length);
      const firstImplPairedFiles = checklist.items
        .filter((item) => String(item.implPath) === String(implFiles[0]!))
        .map((item) => item.pairedFiles.map(String));

      // 34 companion files collapse onto 17 of the impl files, so the group count is strictly
      // smaller than the changed-file count — that gap is what the unit count must be measured
      // against, and what a companion-free fixture would silently skip.
      expect({ changedFileCount: changedFiles.length, groupCount }).toStrictEqual({
        changedFileCount: 204,
        groupCount: SCALE_TEST_CHANGED_FILE_COUNT,
      });
      expect(firstImplPairedFiles).toStrictEqual(
        Array.from({ length: concernsPerFile }, () => [
          `${firstImplBase}.proxy.ts`,
          `${firstImplBase}.test.ts`,
        ]),
      );
      expect(unitCount).toBe(expectedUnitCount);
      expect(remainingLine).toBe(
        `REMAINING (no disposition in quest.planningNotes.blightLedger): ${String(checklist.remainingItemIds.length)} of ${String(unitCount)}`,
      );
      expect(renderedLength).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
    });

    // This is the assertion `blightChecklistLimitsStatics.maxUnits` is actually sized against: a
    // diff sitting AT the cap, in the most expensive per-file shape the transformer renders (every
    // file's disposition status alternates, so every heading carries BOTH a `[x]` line and a `[ ]`
    // line instead of just one). The test above measures the cheaper all-remaining shape at a
    // smaller real-world scale (680 units) — this measures the shape and scale the cap's own
    // headroom is computed from, which is the invariant that let the cap drift out of budget when
    // the concern count last changed without anything catching it.
    it('VALID: {blightChecklistLimitsStatics.maxUnits files at real repo path depth, disposition alternating per file so every heading renders BOTH a [x] and a [ ] line} => the render still fits under mcpToolResultStatics.maxVerbatimChars', () => {
      const { baseRef } = BlightChecklistStub();

      const singleFileProbe = blightChecklistBuildTransformer({
        changedFiles: [
          RepoRelativePathStub({ value: 'packages/orchestrator/src/probe/probe-broker.ts' }),
        ],
        baseRef,
      });
      const concernsPerFile = singleFileProbe.items.length;
      const fileCount = blightChecklistLimitsStatics.maxUnits / concernsPerFile;

      const implFiles = Array.from({ length: fileCount }, (_, index) => {
        const packageName = SCALE_TEST_PACKAGE_NAMES[index % SCALE_TEST_PACKAGE_NAMES.length]!;
        const folderType = SCALE_TEST_FOLDER_TYPES[index % SCALE_TEST_FOLDER_TYPES.length]!;
        const suffix = folderType.slice(0, -1);
        const domain = `${SCALE_TEST_DOMAIN_STEMS[index % SCALE_TEST_DOMAIN_STEMS.length]!}-${String(index)}`;
        return RepoRelativePathStub({
          value: `packages/${packageName}/src/${folderType}/${domain}/${domain}-${suffix}.ts`,
        });
      });

      const baseline = blightChecklistBuildTransformer({ changedFiles: implFiles, baseRef });
      // Disposition exactly ONE concern per file, leaving the rest remaining — every file heading
      // therefore renders both an `[x]` line and a `[ ]` line, the most expensive per-file shape.
      const ledger = implFiles.map((implFile) => {
        const firstItemForFile = baseline.items.find(
          (item) => String(item.implPath) === String(implFile),
        )!;
        return QuestBlightLedgerEntryStub({ itemId: firstItemForFile.id });
      });

      const checklist = blightChecklistBuildTransformer({
        changedFiles: implFiles,
        baseRef,
        ledger,
      });
      const rendered = blightChecklistToTextTransformer({ checklist });
      const unitCount = checklist.items.length;
      const renderedLength = rendered.length;

      expect(unitCount).toBe(blightChecklistLimitsStatics.maxUnits);
      expect(renderedLength).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
    });
  });

  describe('truncation — a diff past the unit cap', () => {
    it('VALID: {300 dispositioned units + 1,000 remaining units, past blightChecklistLimitsStatics.maxUnits} => renders a loud truncation notice, keeps the full REMAINING header count, and shows every remaining file plus only as many dispositioned files as fit the cap', () => {
      const { baseRef } = BlightChecklistStub();
      const remainFileCount = 200;
      const dispFileCount = 60;

      const remainFiles = Array.from({ length: remainFileCount }, (_, index) => {
        const label = `remain-${String(index).padStart(3, '0')}`;
        return RepoRelativePathStub({
          value: `packages/orchestrator/src/transformers/${label}/${label}-transformer.ts`,
        });
      });
      const dispFiles = Array.from({ length: dispFileCount }, (_, index) => {
        const label = `disp-${String(index).padStart(3, '0')}`;
        return RepoRelativePathStub({
          value: `packages/orchestrator/src/transformers/${label}/${label}-transformer.ts`,
        });
      });
      const changedFiles = [...remainFiles, ...dispFiles];

      const baseline = blightChecklistBuildTransformer({ changedFiles, baseRef });
      const concernsPerFile = baseline.items.length / (remainFileCount + dispFileCount);
      const concernOrder = baseline.items
        .filter((item) => String(item.implPath) === String(remainFiles[0]))
        .map((item) => item.concern);

      const dispImplPaths = new Set(dispFiles.map((file) => String(file)));
      const ledger = baseline.items
        .filter((item) => dispImplPaths.has(String(item.implPath)))
        .map((item) => QuestBlightLedgerEntryStub({ itemId: item.id }));

      const checklist = blightChecklistBuildTransformer({ changedFiles, baseRef, ledger });
      const rendered = blightChecklistToTextTransformer({ checklist });
      const lines = rendered.split('\n');

      const remainingUnitBudget = remainFileCount * concernsPerFile;
      const dispositionedUnitBudget = blightChecklistLimitsStatics.maxUnits - remainingUnitBudget;
      const includedDispFileCount = dispositionedUnitBudget / concernsPerFile;

      const unitsHeadingLine = lines.find((line) => line.startsWith('## UNITS'));
      const remainingHeaderLine = lines.find((line) => line.startsWith('REMAINING'));
      const headingLines = lines.filter((line) => line.startsWith('### '));

      const expectedRemainHeadings = Array.from({ length: remainFileCount }, (_, index) => {
        const label = `remain-${String(index).padStart(3, '0')}`;
        return `### packages/orchestrator/src/transformers/${label}/${label}-transformer.ts  (+0 paired)`;
      });
      const expectedDispHeadings = Array.from({ length: includedDispFileCount }, (_, index) => {
        const label = `disp-${String(index).padStart(3, '0')}`;
        return `### packages/orchestrator/src/transformers/${label}/${label}-transformer.ts  (+0 paired)`;
      });

      expect(unitsHeadingLine).toBe(
        `## UNITS — [ ] no disposition yet, [x] already dispositioned in quest.planningNotes.blightLedger — TRUNCATED at the ${String(blightChecklistLimitsStatics.maxUnits)}-unit cap; showing REMAINING units first. This list is INCOMPLETE — call get-blight-checklist again after dispositioning these to see the rest.`,
      );
      expect(remainingHeaderLine).toBe(
        `REMAINING (no disposition in quest.planningNotes.blightLedger): ${String(remainingUnitBudget)} of ${String(checklist.items.length)}`,
      );
      expect(headingLines).toStrictEqual([...expectedRemainHeadings, ...expectedDispHeadings]);
      expect(lines.filter((line) => line.startsWith('    [ ] '))).toStrictEqual(
        Array.from({ length: remainFileCount }, () => `    [ ] ${concernOrder.join(' ')}`),
      );
      expect(lines.filter((line) => line.startsWith('    [x] '))).toStrictEqual(
        Array.from({ length: includedDispFileCount }, () => `    [x] ${concernOrder.join(' ')}`),
      );
    });
  });
});
