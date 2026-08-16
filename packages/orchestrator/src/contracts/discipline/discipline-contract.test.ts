import { disciplineContract } from './discipline-contract';
import { DisciplineStub } from './discipline.stub';

describe('disciplineContract', () => {
  describe('valid disciplines', () => {
    it.each(disciplineContract.options)(
      'VALID: {discipline: %s} => parses successfully',
      (discipline) => {
        const value = DisciplineStub({ value: discipline });

        const result = disciplineContract.parse(value);

        expect(result).toBe(discipline);
      },
    );

    it('VALID: {stub default} => defaults to implementation', () => {
      const discipline = DisciplineStub();

      expect(discipline).toBe('implementation');
    });
  });

  describe('invalid disciplines', () => {
    it('INVALID: {unknown discipline} => throws validation error', () => {
      expect(() => {
        disciplineContract.parse('unknown-discipline');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {number} => throws validation error', () => {
      expect(() => {
        disciplineContract.parse(123 as never);
      }).toThrow(/Expected/u);
    });

    it('INVALID: {null} => throws validation error', () => {
      expect(() => {
        disciplineContract.parse(null as never);
      }).toThrow(/Expected/u);
    });

    it('INVALID: {undefined} => throws validation error', () => {
      expect(() => {
        disciplineContract.parse(undefined as never);
      }).toThrow(/Required/u);
    });

    it('INVALID: {object} => throws validation error', () => {
      expect(() => {
        disciplineContract.parse({} as never);
      }).toThrow(/Expected/u);
    });
  });
});
