import { DependencyStepStub, QuestIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { FilePairWorkUnitStub } from '../file-pair-work-unit/file-pair-work-unit.stub';
import { FileWorkUnitStub } from '../file-work-unit/file-work-unit.stub';
import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
} from './work-unit.stub';
import { workUnitContract } from './work-unit-contract';

describe('workUnitContract', () => {
  describe('pathseeker work unit', () => {
    it('VALID: {role: pathseeker, questId} => parses successfully', () => {
      const result = workUnitContract.parse({
        role: 'pathseeker',
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({
        role: 'pathseeker',
        questId: 'add-auth',
      });
    });

    it('VALID: {PathseekerWorkUnitStub} => parses successfully', () => {
      const stub = PathseekerWorkUnitStub();

      expect(stub.role).toBe('pathseeker');
    });
  });

  describe('codeweaver work unit', () => {
    it('VALID: {role: codeweaver, step} => parses successfully', () => {
      const step = DependencyStepStub();
      const result = workUnitContract.parse({
        role: 'codeweaver',
        step,
      });

      expect(result.role).toBe('codeweaver');
    });

    it('VALID: {CodeweaverWorkUnitStub} => parses successfully', () => {
      const stub = CodeweaverWorkUnitStub();

      expect(stub.role).toBe('codeweaver');
    });
  });

  describe('spiritmender work unit', () => {
    it('VALID: {role: spiritmender, file, stepId} => parses successfully', () => {
      const result = workUnitContract.parse({
        role: 'spiritmender',
        file: FileWorkUnitStub(),
        stepId: StepIdStub(),
      });

      expect(result.role).toBe('spiritmender');
    });

    it('VALID: {SpiritmenderWorkUnitStub} => parses successfully', () => {
      const stub = SpiritmenderWorkUnitStub();

      expect(stub.role).toBe('spiritmender');
    });
  });

  describe('lawbringer work unit', () => {
    it('VALID: {role: lawbringer, filePair, stepId} => parses successfully', () => {
      const result = workUnitContract.parse({
        role: 'lawbringer',
        filePair: FilePairWorkUnitStub(),
        stepId: StepIdStub(),
      });

      expect(result.role).toBe('lawbringer');
    });

    it('VALID: {LawbringerWorkUnitStub} => parses successfully', () => {
      const stub = LawbringerWorkUnitStub();

      expect(stub.role).toBe('lawbringer');
    });
  });

  describe('siegemaster work unit', () => {
    it('VALID: {role: siegemaster, questId, stepId} => parses successfully', () => {
      const result = workUnitContract.parse({
        role: 'siegemaster',
        questId: QuestIdStub({ value: 'add-auth' }),
        stepId: StepIdStub(),
      });

      expect(result.role).toBe('siegemaster');
    });

    it('VALID: {SiegemasterWorkUnitStub} => parses successfully', () => {
      const stub = SiegemasterWorkUnitStub();

      expect(stub.role).toBe('siegemaster');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {unknown role} => throws error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'unknown',
          questId: QuestIdStub({ value: 'add-auth' }),
        }),
      ).toThrow(/Invalid discriminator value/u);
    });
  });
});
