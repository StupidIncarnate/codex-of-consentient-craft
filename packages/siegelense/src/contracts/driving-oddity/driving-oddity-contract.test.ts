import { drivingOddityContract } from './driving-oddity-contract';
import { DrivingOddityStub } from './driving-oddity.stub';

describe('drivingOddityContract', () => {
  describe('valid entries', () => {
    it('VALID: {key, line, kind: "quirk"} => parses successfully', () => {
      const oddity = DrivingOddityStub({
        key: 'GUILD_ADD_MODAL',
        line: 'Clicking the label does nothing — click the wrapper instead.',
        kind: 'quirk',
      });

      const result = drivingOddityContract.parse(oddity);

      expect(result).toStrictEqual({
        key: 'GUILD_ADD_MODAL',
        line: 'Clicking the label does nothing — click the wrapper instead.',
        kind: 'quirk',
      });
    });

    it('VALID: {kind: "defect"} => parses successfully, naming a real bug rather than a quirk', () => {
      const oddity = DrivingOddityStub({ kind: 'defect' });

      const result = drivingOddityContract.parse(oddity);

      expect(result.kind).toBe('defect');
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {kind: "broken"} => an unlisted kind throws validation error', () => {
      expect(() => {
        DrivingOddityStub({ kind: 'broken' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing key} => throws validation error', () => {
      expect(() => {
        drivingOddityContract.parse({
          line: 'Something odd about this screen.',
          kind: 'quirk',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {extra field} => throws validation error, the closed shape rejects drift', () => {
      expect(() => {
        drivingOddityContract.parse({
          key: 'GUILD_ADD_MODAL',
          line: 'Something odd about this screen.',
          kind: 'quirk',
          route: '/guilds',
        } as never);
      }).toThrow(/Unrecognized key\(s\) in object: 'route'/u);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {key: ""} => throws validation error', () => {
      expect(() => {
        DrivingOddityStub({ key: '' as never });
      }).toThrow(/at least 1 character/u);
    });

    it('EMPTY: {line: ""} => throws validation error', () => {
      expect(() => {
        DrivingOddityStub({ line: '' as never });
      }).toThrow(/at least 1 character/u);
    });
  });
});
