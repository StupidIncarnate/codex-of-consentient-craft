import {
  AbsoluteFilePathStub,
  DependencyStepStub,
  ErrorMessageStub,
  FlowObservableStub,
  QuestContractEntryStub,
  QuestIdStub,
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

    it('VALID: {PathseekerWorkUnitStub} => parses successfully', () => {
      const stub = PathseekerWorkUnitStub();

      expect(stub).toStrictEqual({
        role: 'pathseeker',
        questId: QuestIdStub({ value: 'add-auth' }),
      });
    });

    it('VALID: {role: pathseeker, failureContext} => parses with failureContext', () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = workUnitContract.parse({
        role: 'pathseeker',
        questId,
        failureContext: 'FAILED OBSERVABLES: login form did not redirect',
      });

      expect(result).toStrictEqual({
        role: 'pathseeker',
        questId,
        failureContext: 'FAILED OBSERVABLES: login form did not redirect',
      });
    });

    it('VALID: {role: pathseeker, no failureContext} => parses without failureContext', () => {
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

    it('INVALID: {role: pathseeker, failureContext: ""} => throws for empty string', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'pathseeker',
          questId: QuestIdStub({ value: 'add-auth' }),
          failureContext: '',
        }),
      ).toThrow(/too_small/u);
    });
  });

  describe('codeweaver work unit', () => {
    it('VALID: {role: codeweaver, step, questId, relatedContracts, relatedObservables} => parses successfully', () => {
      const step = DependencyStepStub();
      const questId = QuestIdStub({ value: 'add-auth' });
      const relatedContracts = [QuestContractEntryStub()];
      const relatedObservables = [FlowObservableStub()];

      const result = workUnitContract.parse({
        role: 'codeweaver',
        step,
        questId,
        relatedContracts,
        relatedObservables,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        step,
        questId,
        relatedContracts,
        relatedObservables,
        relatedDesignDecisions: [],
        relatedFlows: [],
      });
    });

    it('VALID: {CodeweaverWorkUnitStub} => parses successfully', () => {
      const stub = CodeweaverWorkUnitStub();

      expect(stub).toStrictEqual({
        role: 'codeweaver',
        step: DependencyStepStub(),
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedContracts: [QuestContractEntryStub()],
        relatedObservables: [FlowObservableStub()],
        relatedDesignDecisions: [],
        relatedFlows: [],
      });
    });

    it('EDGE: {CodeweaverWorkUnitStub with empty arrays} => parses successfully', () => {
      const stub = CodeweaverWorkUnitStub({
        relatedContracts: [],
        relatedObservables: [],
      });

      expect(stub).toStrictEqual({
        role: 'codeweaver',
        step: DependencyStepStub(),
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedDesignDecisions: [],
        relatedFlows: [],
      });
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

    it('VALID: {SpiritmenderWorkUnitStub} => parses successfully', () => {
      const stub = SpiritmenderWorkUnitStub();

      expect(stub).toStrictEqual({
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

    it('VALID: {LawbringerWorkUnitStub} => parses successfully', () => {
      const stub = LawbringerWorkUnitStub();

      expect(stub).toStrictEqual({
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
  });

  describe('siegemaster work unit', () => {
    it('VALID: {role: siegemaster, questId, relatedObservables} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const relatedObservables = [FlowObservableStub()];

      const result = workUnitContract.parse({
        role: 'siegemaster',
        questId,
        relatedObservables,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId,
        relatedDesignDecisions: [],
        relatedFlows: [],
        relatedObservables,
      });
    });

    it('VALID: {SiegemasterWorkUnitStub} => parses successfully', () => {
      const stub = SiegemasterWorkUnitStub();

      expect(stub).toStrictEqual({
        role: 'siegemaster',
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedDesignDecisions: [],
        relatedFlows: [],
        relatedObservables: [FlowObservableStub()],
      });
    });

    it('EDGE: {siegemaster with empty relatedObservables} => parses successfully', () => {
      const result = workUnitContract.parse({
        role: 'siegemaster',
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedObservables: [],
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedDesignDecisions: [],
        relatedFlows: [],
        relatedObservables: [],
      });
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

    it('INVALID: {lawbringer fields with codeweaver step} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'lawbringer',
          step: DependencyStepStub(),
        } as never),
      ).toThrow(/required/iu);
    });
  });
});

describe('WorkUnit stubs', () => {
  it('VALID: WorkUnitStub => returns default pathseeker work unit', () => {
    const result = WorkUnitStub();

    expect(result).toStrictEqual({
      role: 'pathseeker',
      questId: QuestIdStub({ value: 'add-auth' }),
    });
  });
});
