import { isFullAutoMockCallGuard } from './is-full-auto-mock-call-guard';
import { MockCallStub } from '../../contracts/mock-call/mock-call.stub';
import { IdentifierNameStub } from '../../contracts/identifier-name/identifier-name.stub';
import { FactoryFunctionTextStub } from '../../contracts/factory-function-text/factory-function-text.stub';

describe('isFullAutoMockCallGuard', () => {
  describe('full-auto requests', () => {
    it('VALID: {factory: null, identifierNames: [], objectIdentifierNames: []} => returns true', () => {
      const mock = MockCallStub({ factory: null, identifierNames: [], objectIdentifierNames: [] });

      const result = isFullAutoMockCallGuard({ mock });

      expect(result).toBe(true);
    });
  });

  describe('selective requests', () => {
    it('INVALID: {identifierNames: [name]} => returns false', () => {
      const mock = MockCallStub({
        factory: null,
        identifierNames: [IdentifierNameStub({ value: 'join' })],
        objectIdentifierNames: [],
      });

      const result = isFullAutoMockCallGuard({ mock });

      expect(result).toBe(false);
    });

    it('INVALID: {objectIdentifierNames: [name]} => returns false', () => {
      const mock = MockCallStub({
        factory: null,
        identifierNames: [],
        objectIdentifierNames: [IdentifierNameStub({ value: 'StartOrchestrator' })],
      });

      const result = isFullAutoMockCallGuard({ mock });

      expect(result).toBe(false);
    });

    it('INVALID: {factory set, both arrays empty} => returns false', () => {
      const mock = MockCallStub({
        factory: FactoryFunctionTextStub({ value: '() => ({ get: jest.fn() })' }),
        identifierNames: [],
        objectIdentifierNames: [],
      });

      const result = isFullAutoMockCallGuard({ mock });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {mock: undefined} => returns false', () => {
      const result = isFullAutoMockCallGuard({});

      expect(result).toBe(false);
    });
  });
});
