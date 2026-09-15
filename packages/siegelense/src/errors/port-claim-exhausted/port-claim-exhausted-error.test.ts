import { PortClaimExhaustedError } from './port-claim-exhausted-error';

describe('PortClaimExhaustedError', () => {
  describe('constructor()', () => {
    it('VALID: {attempts: 5} => sets name and full message', () => {
      const error = new PortClaimExhaustedError({ attempts: 5 });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'PortClaimExhaustedError',
        message: 'Every port pair collided with an already-claimed pair across 5 attempts',
      });
    });

    it('EDGE: {attempts: 1} => embeds the single-attempt count', () => {
      const error = new PortClaimExhaustedError({ attempts: 1 });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'PortClaimExhaustedError',
        message: 'Every port pair collided with an already-claimed pair across 1 attempts',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof PortClaimExhaustedError => returns true', () => {
      const error = new PortClaimExhaustedError({ attempts: 5 });

      expect(error instanceof PortClaimExhaustedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new PortClaimExhaustedError({ attempts: 5 });

      expect(error instanceof Error).toBe(true);
    });
  });
});
