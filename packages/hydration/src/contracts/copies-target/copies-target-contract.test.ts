import { copiesTargetContract } from './copies-target-contract';
import { CopiesTargetStub } from './copies-target.stub';

describe('copiesTargetContract', () => {
  describe('valid copies targets', () => {
    it('VALID: {value: "questPersistBroker"} => returns "questPersistBroker"', () => {
      expect(CopiesTargetStub({ value: 'questPersistBroker' })).toBe('questPersistBroker');
    });

    it('VALID: {value: "guildAddBroker"} => returns "guildAddBroker"', () => {
      expect(CopiesTargetStub({ value: 'guildAddBroker' })).toBe('guildAddBroker');
    });

    it('VALID: {value: "external:claude-cli"} => returns "external:claude-cli"', () => {
      expect(CopiesTargetStub({ value: 'external:claude-cli' })).toBe('external:claude-cli');
    });
  });

  describe('invalid copies targets', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => copiesTargetContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });

    it('INVALID: {value: "claude-mock/bin/claude"} => throws refusing the slash', () => {
      expect(() => copiesTargetContract.parse('claude-mock/bin/claude')).toThrow(
        /copies: may not contain '\/'\. Use a bare identifier naming in-repo production code \(e\.g\. 'guildAddBroker'\), or 'external:<name>' naming a producer outside the repo \(e\.g\. 'external:claude-cli'\)\./u,
      );
    });

    it('INVALID: {value: "external:"} => throws refusing the empty name after the prefix', () => {
      expect(() => copiesTargetContract.parse('external:')).toThrow(
        /copies: 'external:' must name a producer after the prefix\. Use a bare identifier naming in-repo production code \(e\.g\. 'guildAddBroker'\), or 'external:<name>' naming a producer outside the repo \(e\.g\. 'external:claude-cli'\)\./u,
      );
    });
  });
});
