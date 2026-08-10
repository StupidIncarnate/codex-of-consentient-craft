import {
  BlightChecklistStub,
  QuestBlightLedgerEntryStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';

import { blightChecklistBuildTransformer } from './blight-checklist-build-transformer';

describe('blightChecklistBuildTransformer', () => {
  describe('pairing: impl + test + proxy', () => {
    it('VALID: {impl.ts + impl.test.ts + impl.proxy.ts} => one group, one unit per concern, pairedFiles holds the two companions', () => {
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/brokers/foo/foo-broker.ts',
      });
      const testPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/brokers/foo/foo-broker.test.ts',
      });
      const proxyPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/brokers/foo/foo-broker.proxy.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [implPath, testPath, proxyPath],
        baseRef,
      });

      expect(result.items).toStrictEqual([
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:craft',
          implPath,
          concern: 'craft',
          pairedFiles: [proxyPath, testPath],
          label:
            "craft — foo-broker.ts's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
        },
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:perf',
          implPath,
          concern: 'perf',
          pairedFiles: [proxyPath, testPath],
          label:
            'perf — foo-broker.ts has no quadratic loops, N+1 queries, sync I/O in async code, or unbounded work, and does nothing it need not do at all',
        },
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:dedup',
          implPath,
          concern: 'dedup',
          pairedFiles: [proxyPath, testPath],
          label:
            'dedup — foo-broker.ts introduces no semantic duplication, within this diff or against existing repo code',
        },
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:integrity',
          implPath,
          concern: 'integrity',
          pairedFiles: [proxyPath, testPath],
          label:
            "integrity — foo-broker.ts's changed exports still MEAN to their consumers what they did, and no stub, fixture, or `.default(...)` papers over a break",
        },
      ]);
    });
  });

  describe('pairing: test-only diff pulls the impl path into scope', () => {
    it('VALID: {only a .test.tsx changed, .tsx impl absent from the diff} => group implPath is the .tsx', () => {
      const testTsxPath = RepoRelativePathStub({
        value: 'packages/web/src/widgets/foo/foo-widget.test.tsx',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [testTsxPath], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/web/src/widgets/foo/foo-widget.tsx:craft',
        implPath: 'packages/web/src/widgets/foo/foo-widget.tsx',
        concern: 'craft',
        pairedFiles: [testTsxPath],
        label:
          "craft — foo-widget.tsx's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });

    it('VALID: {only a .proxy.tsx changed, .tsx impl absent from the diff} => implPath is .tsx because the companion is .tsx', () => {
      const proxyTsxPath = RepoRelativePathStub({
        value: 'packages/web/src/widgets/bar/bar-widget.proxy.tsx',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [proxyTsxPath],
        baseRef,
      });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/web/src/widgets/bar/bar-widget.tsx:craft',
        implPath: 'packages/web/src/widgets/bar/bar-widget.tsx',
        concern: 'craft',
        pairedFiles: [proxyTsxPath],
        label:
          "craft — bar-widget.tsx's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });
  });

  describe('pairing: .stub.ts resolves to its -contract.ts implementation', () => {
    it('VALID: {contract + its test + its stub} => group is headed by the -contract.ts and the stub is a paired file', () => {
      const contractPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts',
      });
      const contractTestPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.test.ts',
      });
      const stubPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel.stub.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [contractPath, contractTestPath, stubPath],
        baseRef,
      });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:craft',
        implPath: contractPath,
        concern: 'craft',
        pairedFiles: [contractTestPath, stubPath],
        label:
          "craft — torch-fuel-contract.ts's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });

    it('VALID: {contract + its test + its stub} => ONE group of one unit per concern, not two groups', () => {
      const contractPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts',
      });
      const contractTestPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.test.ts',
      });
      const stubPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel.stub.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [contractPath, contractTestPath, stubPath],
        baseRef,
      });

      expect(result.items.map((item) => String(item.id))).toStrictEqual([
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:craft',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:perf',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:dedup',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:integrity',
      ]);
    });

    it('VALID: {only the .stub.ts changed, contract unchanged} => pulls the -contract.ts into scope, never a bare <domain>.ts', () => {
      const stubPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel.stub.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [stubPath], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:craft',
        implPath: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts',
        concern: 'craft',
        pairedFiles: [stubPath],
        label:
          "craft — torch-fuel-contract.ts's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });

    it('VALID: {five contracts each with test + stub} => five -contract.ts groups, no phantom bare-domain group', () => {
      const domains = [
        'torch-fuel',
        'torch-band',
        'torch-reading',
        'torch-burn-body',
        'burn-minutes',
      ];
      const changedFiles = domains.flatMap((domain) => [
        RepoRelativePathStub({
          value: `packages/server/src/contracts/${domain}/${domain}-contract.ts`,
        }),
        RepoRelativePathStub({
          value: `packages/server/src/contracts/${domain}/${domain}-contract.test.ts`,
        }),
        RepoRelativePathStub({
          value: `packages/server/src/contracts/${domain}/${domain}.stub.ts`,
        }),
      ]);
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles, baseRef });

      expect([...new Set(result.items.map((item) => String(item.implPath)))].sort()).toStrictEqual(
        domains
          .map((domain) => `packages/server/src/contracts/${domain}/${domain}-contract.ts`)
          .sort(),
      );
    });
  });

  describe('pairing: .integration.test.ts', () => {
    it('VALID: {.integration.test.ts changed} => strips the full marker, not mangled by the .test.ts rule', () => {
      const path = RepoRelativePathStub({
        value: 'packages/orchestrator/src/startup/start-thing.integration.test.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [path], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/orchestrator/src/startup/start-thing.ts:craft',
        implPath: 'packages/orchestrator/src/startup/start-thing.ts',
        concern: 'craft',
        pairedFiles: [path],
        label:
          "craft — start-thing.ts's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });
  });

  describe('pairing: self-pairing files', () => {
    it('VALID: {.e2e.ts changed} => its own group, implPath is itself, no pairedFiles', () => {
      const e2ePath = RepoRelativePathStub({
        value: 'packages/web/src/flows/quest-chat/foo.e2e.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [e2ePath], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/web/src/flows/quest-chat/foo.e2e.ts:craft',
        implPath: e2ePath,
        concern: 'craft',
        pairedFiles: [],
        label:
          "craft — foo.e2e.ts's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });

    it('VALID: {.harness.ts changed} => its own group, implPath is itself, no pairedFiles', () => {
      const harnessPath = RepoRelativePathStub({
        value: 'packages/web/test/harnesses/quest/quest.harness.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [harnessPath], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/web/test/harnesses/quest/quest.harness.ts:craft',
        implPath: harnessPath,
        concern: 'craft',
        pairedFiles: [],
        label:
          "craft — quest.harness.ts's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });
  });

  describe('pairing: bare dotfiles with no reviewable extension to strip', () => {
    it('VALID: {.gitignore changed} => self-paired as its own unit, not stripped to an empty path', () => {
      const dotfilePath = RepoRelativePathStub({ value: '.gitignore' });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [dotfilePath], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: '.gitignore:craft',
        implPath: dotfilePath,
        concern: 'craft',
        pairedFiles: [],
        label:
          "craft — .gitignore's logic matches its signature, its PURPOSE header is true of the body beneath it, and its error handling carries real context",
      });
    });
  });

  describe('exclusion: non-reviewable source', () => {
    it.each([
      'package.json',
      'README.md',
      'pnpm-lock.yaml',
      'docs/notes.yml',
      'yarn.lock',
      '.claude/hooks/pre-tool-use.ts',
      'packages/foo/.claude/config.ts',
    ])('EMPTY: {changedFiles: [%s]} => zero units', (path) => {
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [RepoRelativePathStub({ value: path })],
        baseRef,
      });

      expect(result.items).toStrictEqual([]);
    });
  });

  describe('coverage against the ledger', () => {
    it('VALID: {empty ledger} => every unit is remaining', () => {
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/guards/foo/foo-guard.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [implPath], baseRef });

      expect(result.remainingItemIds).toStrictEqual(result.items.map((item) => item.id));
    });

    it('VALID: {ledger covering one concern} => that unit drops out of remaining', () => {
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/guards/foo/foo-guard.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [implPath],
        ledger: [
          QuestBlightLedgerEntryStub({
            itemId: 'packages/orchestrator/src/guards/foo/foo-guard.ts:craft',
          }),
        ],
        baseRef,
      });

      expect(result.remainingItemIds).toStrictEqual([
        'packages/orchestrator/src/guards/foo/foo-guard.ts:perf',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:dedup',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:integrity',
      ]);
    });

    it('VALID: {ledger entry for a different implPath} => clears nothing here, because ids embed their own impl path', () => {
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/guards/foo/foo-guard.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [implPath],
        ledger: [
          QuestBlightLedgerEntryStub({
            itemId: 'packages/orchestrator/src/guards/other/other-guard.ts:craft',
          }),
        ],
        baseRef,
      });

      expect(result.remainingItemIds).toStrictEqual([
        'packages/orchestrator/src/guards/foo/foo-guard.ts:craft',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:perf',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:dedup',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:integrity',
      ]);
    });

    it('VALID: {ledger covering every unit} => remaining is empty, the only gate-clearing state', () => {
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/guards/foo/foo-guard.ts',
      });
      const { baseRef } = BlightChecklistStub();
      const allIds = blightChecklistBuildTransformer({
        changedFiles: [implPath],
        baseRef,
      }).items.map((item) => item.id);

      const result = blightChecklistBuildTransformer({
        changedFiles: [implPath],
        ledger: allIds.map((itemId) => QuestBlightLedgerEntryStub({ itemId })),
        baseRef,
      });

      expect(result.remainingItemIds).toStrictEqual([]);
    });
  });

  describe('a persisted ledger id naming a concern the contract no longer carries is INERT', () => {
    // `blightChecklistItemIdContract` is a plain branded string, so a ledger persisted by an older
    // session still parses ids like `<implPath>:coverage`. Those ids simply match no unit: they
    // must not throw, must not appear among the enumerated items, and must not clear a unit that
    // genuinely still needs a disposition.
    it('VALID: {ledger holding a stale <implPath>:coverage entry beside a live <implPath>:craft one} => the stale id is ignored and only craft clears', () => {
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/guards/foo/foo-guard.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({
        changedFiles: [implPath],
        ledger: [
          QuestBlightLedgerEntryStub({
            itemId: 'packages/orchestrator/src/guards/foo/foo-guard.ts:coverage',
          }),
          QuestBlightLedgerEntryStub({
            itemId: 'packages/orchestrator/src/guards/foo/foo-guard.ts:craft',
          }),
        ],
        baseRef,
      });

      expect({
        itemIds: result.items.map((item) => String(item.id)),
        remainingItemIds: result.remainingItemIds.map((itemId) => String(itemId)),
      }).toStrictEqual({
        itemIds: [
          'packages/orchestrator/src/guards/foo/foo-guard.ts:craft',
          'packages/orchestrator/src/guards/foo/foo-guard.ts:perf',
          'packages/orchestrator/src/guards/foo/foo-guard.ts:dedup',
          'packages/orchestrator/src/guards/foo/foo-guard.ts:integrity',
        ],
        remainingItemIds: [
          'packages/orchestrator/src/guards/foo/foo-guard.ts:perf',
          'packages/orchestrator/src/guards/foo/foo-guard.ts:dedup',
          'packages/orchestrator/src/guards/foo/foo-guard.ts:integrity',
        ],
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {changedFiles: []} => zero items and zero remaining, not a throw', () => {
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [], baseRef });

      expect(result).toStrictEqual({ baseRef, items: [], remainingItemIds: [] });
    });
  });

  describe('ordering', () => {
    it('VALID: {two changed files} => groups are emitted sorted by implPath ascending', () => {
      const fileA = RepoRelativePathStub({ value: 'packages/orchestrator/src/a/a-thing.ts' });
      const fileB = RepoRelativePathStub({ value: 'packages/orchestrator/src/b/b-thing.ts' });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [fileB, fileA], baseRef });

      expect(result.items.map((item) => item.implPath)).toStrictEqual([
        fileA,
        fileA,
        fileA,
        fileA,
        fileB,
        fileB,
        fileB,
        fileB,
      ]);
    });

    it('VALID: {same files, input order reversed} => produces the identical items array', () => {
      const fileA = RepoRelativePathStub({ value: 'packages/orchestrator/src/a/a-thing.ts' });
      const fileB = RepoRelativePathStub({ value: 'packages/orchestrator/src/b/b-thing.ts' });
      const { baseRef } = BlightChecklistStub();

      expect(
        blightChecklistBuildTransformer({ changedFiles: [fileA, fileB], baseRef }).items,
      ).toStrictEqual(
        blightChecklistBuildTransformer({ changedFiles: [fileB, fileA], baseRef }).items,
      );
    });
  });

  describe('determinism', () => {
    it('VALID: {same changedFiles enumerated twice} => produces byte-identical items', () => {
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/transformers/foo/foo-transformer.ts',
      });
      const testPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/transformers/foo/foo-transformer.test.ts',
      });
      const changedFiles = [implPath, testPath];
      const { baseRef } = BlightChecklistStub();

      expect(blightChecklistBuildTransformer({ changedFiles, baseRef }).items).toStrictEqual(
        blightChecklistBuildTransformer({ changedFiles, baseRef }).items,
      );
    });
  });
});
