import { isStatusComparisonAllowlistedGuard } from './is-status-comparison-allowlisted-guard';

describe('isStatusComparisonAllowlistedGuard', () => {
  describe('missing filename', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isStatusComparisonAllowlistedGuard({})).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      expect(isStatusComparisonAllowlistedGuard({ filename: '' })).toBe(false);
    });
  });

  describe('allowlisted shared metadata/contract paths', () => {
    it.each([
      '/repo/packages/shared/src/statics/quest-status-metadata/quest-status-metadata-statics.ts',
      '/repo/packages/shared/src/statics/work-item-status-metadata/work-item-status-metadata-statics.ts',
      '/repo/packages/shared/src/statics/quest-status-transitions/quest-status-transitions-statics.ts',
      '/repo/packages/shared/src/contracts/quest-status/quest-status-contract.ts',
      '/repo/packages/shared/src/contracts/work-item-status/work-item-status-contract.ts',
      '/repo/packages/shared/src/contracts/quest-status-metadata/quest-status-metadata-contract.ts',
      '/repo/packages/shared/src/contracts/work-item-status-metadata/work-item-status-metadata-contract.ts',
      '/repo/packages/shared/src/contracts/display-header/display-header-contract.ts',
      '/repo/packages/shared/src/transformers/next-approval-quest-status/next-approval-quest-status-transformer.ts',
      '/repo/packages/shared/src/transformers/display-header-quest-status/display-header-quest-status-transformer.ts',
      '/repo/packages/orchestrator/src/statics/quest-status-transitions/quest-status-transitions-statics.ts',
      '/repo/packages/web/src/guards/is-design-start-visible/is-design-start-visible-guard.ts',
    ] as const)('VALID: {filename: %s} => returns true', (filename) => {
      expect(isStatusComparisonAllowlistedGuard({ filename })).toBe(true);
    });
  });

  describe('allowlisted guard paths (regex-matched)', () => {
    it.each([
      '/repo/packages/shared/src/guards/is-terminal-quest-status/is-terminal-quest-status-guard.ts',
      '/repo/packages/shared/src/guards/is-active-work-item-status/is-active-work-item-status-guard.ts',
    ] as const)('VALID: {filename: %s} => returns true', (filename) => {
      expect(isStatusComparisonAllowlistedGuard({ filename })).toBe(true);
    });
  });

  describe('allowlisted test/stub/proxy/spec/harness paths', () => {
    it.each([
      '/repo/packages/web/src/widgets/foo/foo-widget.test.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.test.tsx',
      '/repo/packages/web/src/widgets/foo/foo-widget.stub.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.stub.tsx',
      '/repo/packages/web/src/widgets/foo/foo-widget.proxy.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.proxy.tsx',
      '/repo/packages/web/src/widgets/foo/foo-widget.spec.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.spec.tsx',
      '/repo/packages/web/src/widgets/foo/foo-widget.integration.test.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.integration.test.tsx',
      '/repo/packages/web/src/widgets/foo/foo-widget.e2e.test.ts',
      '/repo/packages/web/src/widgets/foo/foo-widget.e2e.test.tsx',
      '/repo/packages/web/test/harnesses/quest/quest.harness.ts',
    ] as const)('VALID: {filename: %s} => returns true', (filename) => {
      expect(isStatusComparisonAllowlistedGuard({ filename })).toBe(true);
    });
  });

  describe('allowlisted prompt statics folders', () => {
    it('VALID: pathseeker prompt statics file => returns true', () => {
      expect(
        isStatusComparisonAllowlistedGuard({
          filename:
            '/repo/packages/orchestrator/src/statics/pathseeker-prompt/pathseeker-prompt-statics.ts',
        }),
      ).toBe(true);
    });

    it('VALID: codeweaver prompt statics file => returns true', () => {
      expect(
        isStatusComparisonAllowlistedGuard({
          filename:
            '/repo/packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts',
        }),
      ).toBe(true);
    });
  });

  describe('non-allowlisted production paths', () => {
    it.each([
      '/repo/packages/web/src/widgets/foo/foo-widget.ts',
      '/repo/packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts',
      '/repo/packages/server/src/responders/quest/get/quest-get-responder.ts',
      '/repo/packages/web/src/guards/is-design-tab-visible/is-design-tab-visible-guard.ts',
    ] as const)('EMPTY: {filename: %s} => returns false', (filename) => {
      expect(isStatusComparisonAllowlistedGuard({ filename })).toBe(false);
    });
  });

  describe('windows-style paths', () => {
    it('VALID: Windows-style path with backslashes => normalized and matched', () => {
      expect(
        isStatusComparisonAllowlistedGuard({
          filename:
            'C:\\repo\\packages\\shared\\src\\contracts\\quest-status\\quest-status-contract.ts',
        }),
      ).toBe(true);
    });
  });
});
