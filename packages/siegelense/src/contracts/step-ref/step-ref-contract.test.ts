import { stepRefContract } from './step-ref-contract';
import { StepRefStub } from './step-ref.stub';

describe('stepRefContract', () => {
  describe('valid references', () => {
    it('VALID: {value: "{g.guild.id}"} => parses into step "g", row "guild", field "id"', () => {
      const result = StepRefStub({ value: '{g.guild.id}' });

      expect(result).toStrictEqual({ step: 'g', row: 'guild', field: 'id' });
    });
  });

  describe('invalid references', () => {
    it('INVALID: {value: "{g.guildId}"} => throws naming the two-segment form and the three-segment form it should have been', () => {
      expect(() => stepRefContract.parse('{g.guildId}')).toThrow(
        /has 2 segment\(s\) \(g\.guildId\) — a step reference always has three: \{step\.row\.field\}\./u,
      );
    });

    it('INVALID: {value: "guilds"} => throws — a bare relative string is not wrapped in braces', () => {
      expect(() => stepRefContract.parse('guilds')).toThrow(
        /is not a step reference — a reference is wrapped in braces: \{step\.row\.field\}\./u,
      );
    });

    it('INVALID: {value: "{g.guild.id.extra}"} => throws naming the four-segment form', () => {
      expect(() => stepRefContract.parse('{g.guild.id.extra}')).toThrow(
        /has 4 segment\(s\) \(g\.guild\.id\.extra\)/u,
      );
    });
  });
});
