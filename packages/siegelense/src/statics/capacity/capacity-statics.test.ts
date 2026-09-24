import { capacityStatics } from './capacity-statics';

describe('capacityStatics', () => {
  describe('policy', () => {
    it('VALID: {policy} => toStrictEqual the policy ceiling of three', () => {
      expect(capacityStatics.policy).toStrictEqual({ ceiling: 3 });
    });
  });

  describe('memory', () => {
    it('VALID: {memory} => toStrictEqual 512MB of headroom', () => {
      expect(capacityStatics.memory).toStrictEqual({ headroomMB: 512 });
    });

    it("VALID: {the spec's own worked example} => 5320MB free less headroom leaves 4808MB to divide", () => {
      expect(5320 - capacityStatics.memory.headroomMB).toBe(4808);
    });
  });

  describe('noProfile', () => {
    it('VALID: {noProfile} => toStrictEqual a default pair', () => {
      expect(capacityStatics.noProfile).toStrictEqual({ suggested: 2 });
    });
  });

  describe('defaults', () => {
    it('VALID: {defaults} => toStrictEqual the browsered convention name', () => {
      expect(capacityStatics.defaults).toStrictEqual({ specName: 'stack' });
    });
  });
});
