import { platformCrossingViolationContract } from './platform-crossing-violation-contract';
import { PlatformCrossingViolationStub } from './platform-crossing-violation.stub';

describe('platformCrossingViolationContract', () => {
  describe('valid inputs', () => {
    it('VALID: {chain with two hops} => parses successfully', () => {
      const result = platformCrossingViolationContract.parse(
        PlatformCrossingViolationStub({
          chain: ['@dungeonmaster/shared/brokers', '@dungeonmaster/node/fs'],
        }),
      );

      expect(result).toStrictEqual({
        packageName: 'web',
        platform: 'browser',
        chain: ['@dungeonmaster/shared/brokers', '@dungeonmaster/node/fs'],
        crossedGatewayPackage: '@dungeonmaster/node',
      });
    });

    it('VALID: {platform: "node"} => parses successfully', () => {
      const result = platformCrossingViolationContract.parse(
        PlatformCrossingViolationStub({
          packageName: 'orchestrator',
          platform: 'node',
          chain: ['@dungeonmaster/browser/fetch'],
          crossedGatewayPackage: '@dungeonmaster/browser',
        }),
      );

      expect(result).toStrictEqual({
        packageName: 'orchestrator',
        platform: 'node',
        chain: ['@dungeonmaster/browser/fetch'],
        crossedGatewayPackage: '@dungeonmaster/browser',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {chain: []} => throws validation error', () => {
      expect(() =>
        platformCrossingViolationContract.parse(PlatformCrossingViolationStub({ chain: [] })),
      ).toThrow(/>=1/u);
    });

    it('INVALID: {platform: "server"} => throws validation error', () => {
      expect(() =>
        platformCrossingViolationContract.parse(
          PlatformCrossingViolationStub({ platform: 'server' }),
        ),
      ).toThrow(/Invalid option/u);
    });

    it('INVALID: {missing crossedGatewayPackage} => throws validation error', () => {
      const { crossedGatewayPackage: _omit, ...withoutField } = PlatformCrossingViolationStub();

      expect(() => platformCrossingViolationContract.parse(withoutField)).toThrow(
        /received undefined/u,
      );
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a browser violation reaching node fs', () => {
      const result = PlatformCrossingViolationStub();

      expect(result).toStrictEqual({
        packageName: 'web',
        platform: 'browser',
        chain: ['@dungeonmaster/node/fs'],
        crossedGatewayPackage: '@dungeonmaster/node',
      });
    });
  });
});
