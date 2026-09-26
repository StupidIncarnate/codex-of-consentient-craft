import { platformCrossingReportTransformer } from './platform-crossing-report-transformer';
import { PlatformCrossingViolationStub } from '../../contracts/platform-crossing-violation/platform-crossing-violation.stub';

describe('platformCrossingReportTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {violations: []} => returns the clean-run message', () => {
      const result = platformCrossingReportTransformer({ violations: [] });

      expect(result).toBe(
        'platform-crossing: PASS — no browser package reaches a node/bin gateway import, and no ' +
          'node-platform package reaches a browser gateway import.',
      );
    });
  });

  describe('valid inputs', () => {
    it('VALID: {violations: [one]} => renders the FAIL header and one block', () => {
      const violation = PlatformCrossingViolationStub();

      const result = platformCrossingReportTransformer({ violations: [violation] });

      expect(result).toBe(
        'platform-crossing: FAIL — 1 crossing(s) found\n\n' +
          'web (browser) → @dungeonmaster/node/fs\n@dungeonmaster/node is not available in a browser package',
      );
    });

    it('VALID: {violations: [two]} => separates blocks with a blank line', () => {
      const first = PlatformCrossingViolationStub();
      const second = PlatformCrossingViolationStub({
        packageName: 'orchestrator',
        platform: 'node',
        chain: ['@dungeonmaster/browser/fetch'],
        crossedGatewayPackage: '@dungeonmaster/browser',
      });

      const result = platformCrossingReportTransformer({ violations: [first, second] });

      expect(result).toBe(
        'platform-crossing: FAIL — 2 crossing(s) found\n\n' +
          'web (browser) → @dungeonmaster/node/fs\n@dungeonmaster/node is not available in a browser package\n\n' +
          'orchestrator (node) → @dungeonmaster/browser/fetch\n@dungeonmaster/browser is not available in a node package',
      );
    });
  });
});
