import { debugSessionBrokerParamsContract } from './debug-session-broker-params-contract';
import { DebugSessionBrokerParamsStub } from './debug-session-broker-params.stub';
import { RenderCapabilitiesStub } from '../render-capabilities/render-capabilities.stub';

describe('debugSessionBrokerParamsContract', () => {
  describe('valid input', () => {
    it('VALID: {onCommand, onResponse, renderCapabilities, initialScreen} => parses successfully', () => {
      const input = DebugSessionBrokerParamsStub();

      const result = debugSessionBrokerParamsContract.parse(input);

      expect(result).toStrictEqual({
        onCommand: expect.any(Function),
        onResponse: expect.any(Function),
        renderCapabilities: {
          writeStdin: expect.any(Function),
          getFrame: expect.any(Function),
          unmount: expect.any(Function),
        },
        initialScreen: 'menu',
      });
    });

    it('VALID: {with different initialScreen} => parses with custom screen', () => {
      const input = DebugSessionBrokerParamsStub({ initialScreen: 'help' });

      const result = debugSessionBrokerParamsContract.parse(input);

      expect(result.initialScreen).toBe('help');
    });
  });

  describe('invalid input', () => {
    it('INVALID_INITIALSCREEN: {initialScreen: "invalid"} => throws validation error', () => {
      expect(() => {
        debugSessionBrokerParamsContract.parse({
          onCommand: (): void => {
            // No-op
          },
          onResponse: (): void => {
            // No-op
          },
          renderCapabilities: RenderCapabilitiesStub(),
          initialScreen: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
