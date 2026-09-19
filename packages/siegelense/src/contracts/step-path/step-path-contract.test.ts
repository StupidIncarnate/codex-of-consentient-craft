import { stepPathContract } from './step-path-contract';
import { StepPathStub } from './step-path.stub';

describe('stepPathContract', () => {
  describe('a rooted path', () => {
    it.each(['/', '/queue', '/siege-guild/quest/abc', '/{g.guildSlug}'])(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        expect(StepPathStub({ value })).toBe(value);
      },
    );
  });

  describe('a path that IS a placeholder', () => {
    it.each(['{s.sessions.nested}', '{seeded.sessions.nested}', '{g.route}/tail'])(
      'VALID: {value: %s} => parses, because the recipe that mints it has not run yet',
      (value) => {
        expect(StepPathStub({ value })).toBe(value);
      },
    );
  });

  describe('anything else', () => {
    it.each(['queue', 'http://localhost:3000/queue', '', 'x{g.a}'])(
      'INVALID: {value: %s} => throws naming both accepted forms',
      (value) => {
        expect(() => stepPathContract.parse(value)).toThrow(/a goto path must start with/u);
      },
    );
  });
});
