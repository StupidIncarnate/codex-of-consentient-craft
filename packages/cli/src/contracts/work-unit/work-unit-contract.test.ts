import { DependencyStepStub, QuestIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { workUnitContract } from './work-unit-contract';
import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
  WorkUnitStub,
} from './work-unit.stub';
import { FilePairWorkUnitStub } from '../file-pair-work-unit/file-pair-work-unit.stub';
import { FileWorkUnitStub } from '../file-work-unit/file-work-unit.stub';

describe('workUnitContract', () => {
  describe('pathseeker work unit', () => {
    it('VALID: {role: pathseeker, questId} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = workUnitContract.parse({
        role: 'pathseeker',
        questId,
      });

      expect(result).toStrictEqual({
        role: 'pathseeker',
        questId,
      });
    });

    it('INVALID_ROLE: {role: pathseeker, missing questId} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'pathseeker',
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('codeweaver work unit', () => {
    it('VALID: {role: codeweaver, step} => parses successfully', () => {
      const step = DependencyStepStub({ name: 'Create user API' });

      const result = workUnitContract.parse({
        role: 'codeweaver',
        step,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        step,
      });
    });

    it('INVALID_ROLE: {role: codeweaver, missing step} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'codeweaver',
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('spiritmender work unit', () => {
    it('VALID: {role: spiritmender, file, stepId} => parses successfully', () => {
      const file = FileWorkUnitStub();
      const stepId = StepIdStub();

      const result = workUnitContract.parse({
        role: 'spiritmender',
        file,
        stepId,
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        file,
        stepId,
      });
    });

    it('INVALID_ROLE: {role: spiritmender, missing file} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'spiritmender',
          stepId: StepIdStub(),
        }),
      ).toThrow(/required/iu);
    });

    it('INVALID_ROLE: {role: spiritmender, missing stepId} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'spiritmender',
          file: FileWorkUnitStub(),
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('lawbringer work unit', () => {
    it('VALID: {role: lawbringer, filePair, stepId} => parses successfully', () => {
      const filePair = FilePairWorkUnitStub();
      const stepId = StepIdStub();

      const result = workUnitContract.parse({
        role: 'lawbringer',
        filePair,
        stepId,
      });

      expect(result).toStrictEqual({
        role: 'lawbringer',
        filePair,
        stepId,
      });
    });

    it('INVALID_ROLE: {role: lawbringer, missing filePair} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'lawbringer',
          stepId: StepIdStub(),
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('siegemaster work unit', () => {
    it('VALID: {role: siegemaster, questId, stepId} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const stepId = StepIdStub();

      const result = workUnitContract.parse({
        role: 'siegemaster',
        questId,
        stepId,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId,
        stepId,
      });
    });

    it('INVALID_ROLE: {role: siegemaster, missing stepId} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'siegemaster',
          questId: QuestIdStub({ value: 'add-auth' }),
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('invalid roles', () => {
    it('INVALID_ROLE: {role: unknown} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'unknown',
          questId: QuestIdStub({ value: 'add-auth' }),
        }),
      ).toThrow(/invalid discriminator/iu);
    });
  });
});

describe('WorkUnit stubs', () => {
  it('VALID: PathseekerWorkUnitStub => returns pathseeker work unit', () => {
    const result = PathseekerWorkUnitStub();

    expect(result.role).toBe('pathseeker');
  });

  it('VALID: CodeweaverWorkUnitStub => returns codeweaver work unit', () => {
    const result = CodeweaverWorkUnitStub();

    expect(result.role).toBe('codeweaver');
  });

  it('VALID: SpiritmenderWorkUnitStub => returns spiritmender work unit', () => {
    const result = SpiritmenderWorkUnitStub();

    expect(result.role).toBe('spiritmender');
  });

  it('VALID: LawbringerWorkUnitStub => returns lawbringer work unit', () => {
    const result = LawbringerWorkUnitStub();

    expect(result.role).toBe('lawbringer');
  });

  it('VALID: SiegemasterWorkUnitStub => returns siegemaster work unit', () => {
    const result = SiegemasterWorkUnitStub();

    expect(result.role).toBe('siegemaster');
  });

  it('VALID: WorkUnitStub => returns default pathseeker work unit', () => {
    const result = WorkUnitStub();

    expect(result.role).toBe('pathseeker');
  });
});
