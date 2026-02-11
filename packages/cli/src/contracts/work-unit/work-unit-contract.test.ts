import {
  AbsoluteFilePathStub,
  ContextStub,
  DependencyStepStub,
  ErrorMessageStub,
  ObservableStub,
  QuestContractEntryStub,
  QuestIdStub,
  RequirementStub,
} from '@dungeonmaster/shared/contracts';

import { workUnitContract } from './work-unit-contract';
import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
  WorkUnitStub,
} from './work-unit.stub';

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
    it('VALID: {role: codeweaver, step, questId, relatedContracts, relatedObservables, relatedRequirements} => parses successfully', () => {
      const step = DependencyStepStub({ name: 'Create user API' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const relatedContracts = [QuestContractEntryStub()];
      const relatedObservables = [ObservableStub()];
      const relatedRequirements = [RequirementStub()];

      const result = workUnitContract.parse({
        role: 'codeweaver',
        step,
        questId,
        relatedContracts,
        relatedObservables,
        relatedRequirements,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        step,
        questId,
        relatedContracts,
        relatedObservables,
        relatedRequirements,
      });
    });

    it('INVALID_ROLE: {role: codeweaver, missing step} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'codeweaver',
          questId: QuestIdStub({ value: 'add-auth' }),
          relatedContracts: [],
          relatedObservables: [],
          relatedRequirements: [],
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('spiritmender work unit', () => {
    it('VALID: {role: spiritmender, filePaths, errors} => parses successfully', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/file.ts' })];
      const errors = [ErrorMessageStub({ value: 'Missing return type' })];

      const result = workUnitContract.parse({
        role: 'spiritmender',
        filePaths,
        errors,
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        filePaths,
        errors,
      });
    });

    it('VALID: {role: spiritmender, filePaths without errors} => parses successfully', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/file.ts' })];

      const result = workUnitContract.parse({
        role: 'spiritmender',
        filePaths,
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        filePaths,
      });
    });

    it('INVALID_ROLE: {role: spiritmender, missing filePaths} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'spiritmender',
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('lawbringer work unit', () => {
    it('VALID: {role: lawbringer, filePaths} => parses successfully', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/broker.ts' })];

      const result = workUnitContract.parse({
        role: 'lawbringer',
        filePaths,
      });

      expect(result).toStrictEqual({
        role: 'lawbringer',
        filePaths,
      });
    });

    it('INVALID_ROLE: {role: lawbringer, missing filePaths} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'lawbringer',
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('siegemaster work unit', () => {
    it('VALID: {role: siegemaster, questId, observables, contexts} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const observables = [ObservableStub()];
      const contexts = [ContextStub()];

      const result = workUnitContract.parse({
        role: 'siegemaster',
        questId,
        observables,
        contexts,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId,
        observables,
        contexts,
      });
    });

    it('INVALID_ROLE: {role: siegemaster, missing observables} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'siegemaster',
          questId: QuestIdStub({ value: 'add-auth' }),
          contexts: [ContextStub()],
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

    expect(result).toStrictEqual({
      role: 'pathseeker',
      questId: QuestIdStub({ value: 'add-auth' }),
    });
  });

  it('VALID: CodeweaverWorkUnitStub => returns codeweaver work unit', () => {
    const result = CodeweaverWorkUnitStub();

    expect(result).toStrictEqual({
      role: 'codeweaver',
      step: DependencyStepStub(),
      questId: QuestIdStub({ value: 'add-auth' }),
      relatedContracts: [QuestContractEntryStub()],
      relatedObservables: [ObservableStub()],
      relatedRequirements: [RequirementStub()],
    });
  });

  it('EDGE: {CodeweaverWorkUnitStub with empty arrays} => parses successfully', () => {
    const result = CodeweaverWorkUnitStub({
      relatedContracts: [],
      relatedObservables: [],
      relatedRequirements: [],
    });

    expect(result).toStrictEqual({
      role: 'codeweaver',
      step: DependencyStepStub(),
      questId: QuestIdStub({ value: 'add-auth' }),
      relatedContracts: [],
      relatedObservables: [],
      relatedRequirements: [],
    });
  });

  it('VALID: SpiritmenderWorkUnitStub => returns spiritmender work unit', () => {
    const result = SpiritmenderWorkUnitStub();

    expect(result).toStrictEqual({
      role: 'spiritmender',
      filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
    });
  });

  it('EDGE: {spiritmender with empty errors array} => parses successfully', () => {
    const result = workUnitContract.parse({
      role: 'spiritmender',
      filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
      errors: [],
    });

    expect(result).toStrictEqual({
      role: 'spiritmender',
      filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
      errors: [],
    });
  });

  it('EDGE: {spiritmender with errors omitted} => parses without errors field', () => {
    const result = workUnitContract.parse({
      role: 'spiritmender',
      filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
    });

    expect(result).toStrictEqual({
      role: 'spiritmender',
      filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
    });
  });

  it('VALID: LawbringerWorkUnitStub => returns lawbringer work unit', () => {
    const result = LawbringerWorkUnitStub();

    expect(result).toStrictEqual({
      role: 'lawbringer',
      filePaths: [AbsoluteFilePathStub({ value: '/src/broker.ts' })],
    });
  });

  it('EDGE: {lawbringer with empty filePaths} => parses successfully', () => {
    const result = workUnitContract.parse({
      role: 'lawbringer',
      filePaths: [],
    });

    expect(result).toStrictEqual({
      role: 'lawbringer',
      filePaths: [],
    });
  });

  it('VALID: SiegemasterWorkUnitStub => returns siegemaster work unit', () => {
    const result = SiegemasterWorkUnitStub();

    expect(result).toStrictEqual({
      role: 'siegemaster',
      questId: QuestIdStub({ value: 'add-auth' }),
      observables: [ObservableStub()],
      contexts: [ContextStub()],
    });
  });

  it('EDGE: {siegemaster with empty observables and contexts} => parses successfully', () => {
    const result = workUnitContract.parse({
      role: 'siegemaster',
      questId: QuestIdStub({ value: 'add-auth' }),
      observables: [],
      contexts: [],
    });

    expect(result).toStrictEqual({
      role: 'siegemaster',
      questId: QuestIdStub({ value: 'add-auth' }),
      observables: [],
      contexts: [],
    });
  });

  it('VALID: WorkUnitStub => returns default pathseeker work unit', () => {
    const result = WorkUnitStub();

    expect(result).toStrictEqual({
      role: 'pathseeker',
      questId: QuestIdStub({ value: 'add-auth' }),
    });
  });

  it('INVALID_ROLE: {lawbringer fields with codeweaver step} => throws validation error', () => {
    expect(() =>
      workUnitContract.parse({
        role: 'lawbringer',
        step: DependencyStepStub(),
      } as never),
    ).toThrow(/required/iu);
  });
});
