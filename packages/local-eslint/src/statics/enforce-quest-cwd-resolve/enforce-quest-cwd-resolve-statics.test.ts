import { enforceQuestCwdResolveStatics } from './enforce-quest-cwd-resolve-statics';

describe('enforceQuestCwdResolveStatics', () => {
  describe('bannedImportName', () => {
    it('VALID: bannedImportName => equals the main-checkout resolver binding', () => {
      expect(enforceQuestCwdResolveStatics.bannedImportName).toBe('questRepoRootBroker');
    });
  });

  describe('allowedPathFragments', () => {
    it('VALID: allowedPathFragments => equals the resolver, the riftcarver step handler and the broker folder', () => {
      expect(enforceQuestCwdResolveStatics.allowedPathFragments).toStrictEqual([
        'packages/orchestrator/src/brokers/quest/cwd-resolve/quest-cwd-resolve-broker.ts',
        'packages/orchestrator/src/brokers/step-handler/riftcarver/step-handler-riftcarver-broker.ts',
        'packages/orchestrator/src/brokers/quest/repo-root/',
      ]);
    });
  });

  describe('exemptFileSuffixes', () => {
    it('VALID: exemptFileSuffixes => equals the test-support file suffixes', () => {
      expect(enforceQuestCwdResolveStatics.exemptFileSuffixes).toStrictEqual([
        '.test.ts',
        '.proxy.ts',
        '.stub.ts',
        '.harness.ts',
      ]);
    });
  });
});
