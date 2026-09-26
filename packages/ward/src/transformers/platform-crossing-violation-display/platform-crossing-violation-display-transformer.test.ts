import { platformCrossingViolationDisplayTransformer } from './platform-crossing-violation-display-transformer';
import { PlatformCrossingViolationStub } from '../../contracts/platform-crossing-violation/platform-crossing-violation.stub';

describe('platformCrossingViolationDisplayTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {direct crossing} => renders one arrow and the reason line', () => {
      const violation = PlatformCrossingViolationStub();

      const result = platformCrossingViolationDisplayTransformer({ violation });

      expect(result).toBe(
        'web (browser) → @dungeonmaster/node/fs\n@dungeonmaster/node is not available in a browser package',
      );
    });

    it('VALID: {multi-hop chain} => renders every hop in order', () => {
      const violation = PlatformCrossingViolationStub({
        chain: [
          '@dungeonmaster/shared/brokers',
          './cwd-resolve/cwd-resolve-broker',
          '@dungeonmaster/node/fs',
        ],
      });

      const result = platformCrossingViolationDisplayTransformer({ violation });

      expect(result).toBe(
        'web (browser) → @dungeonmaster/shared/brokers → ./cwd-resolve/cwd-resolve-broker → @dungeonmaster/node/fs\n@dungeonmaster/node is not available in a browser package',
      );
    });

    it('VALID: {platform: "node"} => names the browser gateway instead', () => {
      const violation = PlatformCrossingViolationStub({
        packageName: 'orchestrator',
        platform: 'node',
        chain: ['@dungeonmaster/browser/fetch'],
        crossedGatewayPackage: '@dungeonmaster/browser',
      });

      const result = platformCrossingViolationDisplayTransformer({ violation });

      expect(result).toBe(
        'orchestrator (node) → @dungeonmaster/browser/fetch\n@dungeonmaster/browser is not available in a node package',
      );
    });
  });
});
