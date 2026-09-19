import { profileStatics } from './profile-statics';

describe('profileStatics', () => {
  describe('dirs', () => {
    it('VALID: {dirs} => names the samples and boots directories, and nothing else', () => {
      expect(profileStatics.dirs).toStrictEqual({ samples: 'samples', boots: 'boots' });
    });
  });

  describe('extensions', () => {
    it('VALID: {extensions} => a per-instance record is a .json file', () => {
      expect(profileStatics.extensions).toStrictEqual({ record: '.json' });
    });
  });

  describe('settle', () => {
    it('VALID: {settle} => the steady window opens 30000ms after a record first beat', () => {
      expect(profileStatics.settle).toStrictEqual({ afterMs: 30_000 });
    });
  });

  describe('table', () => {
    it('VALID: {table} => defines the expected headers and cell padding', () => {
      expect(profileStatics.table).toStrictEqual({
        headers: ['POOL', 'STEADY', 'PEAK', 'RUNS'],
        cellPadding: 2,
      });
    });
  });
});
