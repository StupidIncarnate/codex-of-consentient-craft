import {
  BlightChecklistStub,
  QuestBlightLedgerEntryStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';

import { blightChecklistBuildTransformer } from './blight-checklist-build-transformer';

describe('blightChecklistBuildTransformer', () => {
  describe('pairing: impl + test + proxy', () => {
    it('VALID: {impl.ts + impl.test.ts + impl.proxy.ts} => one group, 7 units, pairedFiles holds the two companions', () => {
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
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:coverage',
          implPath,
          concern: 'coverage',
          pairedFiles: [proxyPath, testPath],
          label: 'coverage — every branch in foo-broker.ts has a real test',
        },
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:craft',
          implPath,
          concern: 'craft',
          pairedFiles: [proxyPath, testPath],
          label:
            "craft — foo-broker.ts's logic matches its signature, its error handling carries real context, and nothing needless remains",
        },
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:security',
          implPath,
          concern: 'security',
          pairedFiles: [proxyPath, testPath],
          label:
            'security — no untrusted input in foo-broker.ts reaches a dangerous sink without a validating contract',
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
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:perf',
          implPath,
          concern: 'perf',
          pairedFiles: [proxyPath, testPath],
          label:
            'perf — foo-broker.ts has no quadratic loops, N+1 queries, sync I/O in async code, or unbounded work',
        },
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:integrity',
          implPath,
          concern: 'integrity',
          pairedFiles: [proxyPath, testPath],
          label: "integrity — every consumer of foo-broker.ts's changed exports still works",
        },
        {
          id: 'packages/orchestrator/src/brokers/foo/foo-broker.ts:dead-code',
          implPath,
          concern: 'dead-code',
          pairedFiles: [proxyPath, testPath],
          label: 'dead-code — foo-broker.ts carries no orphan exports or unreachable branches',
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
        id: 'packages/web/src/widgets/foo/foo-widget.tsx:coverage',
        implPath: 'packages/web/src/widgets/foo/foo-widget.tsx',
        concern: 'coverage',
        pairedFiles: [testTsxPath],
        label: 'coverage — every branch in foo-widget.tsx has a real test',
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
        id: 'packages/web/src/widgets/bar/bar-widget.tsx:coverage',
        implPath: 'packages/web/src/widgets/bar/bar-widget.tsx',
        concern: 'coverage',
        pairedFiles: [proxyTsxPath],
        label: 'coverage — every branch in bar-widget.tsx has a real test',
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
        id: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:coverage',
        implPath: contractPath,
        concern: 'coverage',
        pairedFiles: [contractTestPath, stubPath],
        label: 'coverage — every branch in torch-fuel-contract.ts has a real test',
      });
    });

    it('VALID: {contract + its test + its stub} => ONE group of 7 units, not two groups of 14', () => {
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
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:coverage',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:craft',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:security',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:dedup',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:perf',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:integrity',
        'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:dead-code',
      ]);
    });

    it('VALID: {only the .stub.ts changed, contract unchanged} => pulls the -contract.ts into scope, never a bare <domain>.ts', () => {
      const stubPath = RepoRelativePathStub({
        value: 'packages/server/src/contracts/torch-fuel/torch-fuel.stub.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [stubPath], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts:coverage',
        implPath: 'packages/server/src/contracts/torch-fuel/torch-fuel-contract.ts',
        concern: 'coverage',
        pairedFiles: [stubPath],
        label: 'coverage — every branch in torch-fuel-contract.ts has a real test',
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
        id: 'packages/orchestrator/src/startup/start-thing.ts:coverage',
        implPath: 'packages/orchestrator/src/startup/start-thing.ts',
        concern: 'coverage',
        pairedFiles: [path],
        label: 'coverage — every branch in start-thing.ts has a real test',
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
        id: 'packages/web/src/flows/quest-chat/foo.e2e.ts:coverage',
        implPath: e2ePath,
        concern: 'coverage',
        pairedFiles: [],
        label: 'coverage — every branch in foo.e2e.ts has a real test',
      });
    });

    it('VALID: {.harness.ts changed} => its own group, implPath is itself, no pairedFiles', () => {
      const harnessPath = RepoRelativePathStub({
        value: 'packages/web/test/harnesses/quest/quest.harness.ts',
      });
      const { baseRef } = BlightChecklistStub();

      const result = blightChecklistBuildTransformer({ changedFiles: [harnessPath], baseRef });

      expect(result.items[0]).toStrictEqual({
        id: 'packages/web/test/harnesses/quest/quest.harness.ts:coverage',
        implPath: harnessPath,
        concern: 'coverage',
        pairedFiles: [],
        label: 'coverage — every branch in quest.harness.ts has a real test',
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
            itemId: 'packages/orchestrator/src/guards/foo/foo-guard.ts:coverage',
          }),
        ],
        baseRef,
      });

      expect(result.remainingItemIds).toStrictEqual([
        'packages/orchestrator/src/guards/foo/foo-guard.ts:craft',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:security',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:dedup',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:perf',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:integrity',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:dead-code',
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
            itemId: 'packages/orchestrator/src/guards/other/other-guard.ts:coverage',
          }),
        ],
        baseRef,
      });

      expect(result.remainingItemIds).toStrictEqual([
        'packages/orchestrator/src/guards/foo/foo-guard.ts:coverage',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:craft',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:security',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:dedup',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:perf',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:integrity',
        'packages/orchestrator/src/guards/foo/foo-guard.ts:dead-code',
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
        fileA,
        fileA,
        fileA,
        fileB,
        fileB,
        fileB,
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
