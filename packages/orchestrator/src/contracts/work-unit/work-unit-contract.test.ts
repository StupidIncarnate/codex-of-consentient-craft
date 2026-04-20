import {
  AbsoluteFilePathStub,
  DependencyStepStub,
  ErrorMessageStub,
  FlowObservableStub,
  FlowStub,
  QuestContractEntryStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { workUnitContract } from './work-unit-contract';
import {
  BlightwardenWorkUnitStub,
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
    it('VALID: {role: codeweaver, steps, questId, relatedContracts, relatedObservables} => parses successfully', () => {
      const step = DependencyStepStub();
      const questId = QuestIdStub({ value: 'add-auth' });
      const relatedContracts = [QuestContractEntryStub()];
      const relatedObservables = [FlowObservableStub()];

      const result = workUnitContract.parse({
        role: 'codeweaver',
        steps: [step],
        folderTypes: ['brokers'],
        questId,
        relatedContracts,
        relatedObservables,
      });

      expect(result).toStrictEqual({
        role: 'codeweaver',
        steps: [step],
        folderTypes: ['brokers'],
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
        steps: [DependencyStepStub()],
        folderTypes: ['brokers'],
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
        steps: [DependencyStepStub()],
        folderTypes: ['brokers'],
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

    it('VALID: {spiritmender with verificationCommand} => parses with verificationCommand', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/file.ts' })];

      const result = workUnitContract.parse({
        role: 'spiritmender',
        filePaths,
        verificationCommand: 'npm run build --workspace=@dungeonmaster/shared',
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        filePaths,
        verificationCommand: 'npm run build --workspace=@dungeonmaster/shared',
      });
    });

    it('INVALID: {spiritmender with empty verificationCommand} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'spiritmender',
          filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
          verificationCommand: '',
        }),
      ).toThrow(/too_small/u);
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

    it('VALID: {spiritmender with contextInstructions} => parses with contextInstructions', () => {
      const filePaths = [AbsoluteFilePathStub({ value: '/src/file.ts' })];

      const result = workUnitContract.parse({
        role: 'spiritmender',
        filePaths,
        contextInstructions: '## Instructions\nFix the build.',
      });

      expect(result).toStrictEqual({
        role: 'spiritmender',
        filePaths,
        contextInstructions: '## Instructions\nFix the build.',
      });
    });

    it('INVALID: {spiritmender with empty contextInstructions} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'spiritmender',
          filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
          contextInstructions: '',
        }),
      ).toThrow(/too_small/u);
    });
  });

  describe('lawbringer work unit', () => {
    it('VALID: {role: lawbringer, filePaths, folderTypes, stepBoundaries} => parses successfully', () => {
      const step = DependencyStepStub();
      const filePaths = [AbsoluteFilePathStub({ value: '/src/broker.ts' })];

      const result = workUnitContract.parse({
        role: 'lawbringer',
        filePaths,
        folderTypes: ['brokers'],
        stepBoundaries: [{ stepId: step.id, filePaths }],
      });

      expect(result).toStrictEqual({
        role: 'lawbringer',
        filePaths,
        folderTypes: ['brokers'],
        stepBoundaries: [{ stepId: step.id, filePaths }],
      });
    });

    it('VALID: {LawbringerWorkUnitStub} => parses successfully', () => {
      const stub = LawbringerWorkUnitStub();

      expect(stub).toStrictEqual({
        role: 'lawbringer',
        filePaths: [AbsoluteFilePathStub({ value: '/src/broker.ts' })],
        folderTypes: ['brokers'],
        stepBoundaries: [
          {
            stepId: DependencyStepStub().id,
            filePaths: [AbsoluteFilePathStub({ value: '/src/broker.ts' })],
          },
        ],
      });
    });

    it('EDGE: {lawbringer with empty filePaths and single stepBoundary} => parses successfully', () => {
      const step = DependencyStepStub();
      const result = workUnitContract.parse({
        role: 'lawbringer',
        filePaths: [],
        folderTypes: [],
        stepBoundaries: [{ stepId: step.id, filePaths: [] }],
      });

      expect(result).toStrictEqual({
        role: 'lawbringer',
        filePaths: [],
        folderTypes: [],
        stepBoundaries: [{ stepId: step.id, filePaths: [] }],
      });
    });
  });

  describe('siegemaster work unit', () => {
    it('VALID: {role: siegemaster, questId, flow} => parses successfully', () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const flow = FlowStub();

      const result = workUnitContract.parse({
        role: 'siegemaster',
        questId,
        flow,
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId,
        flow,
        relatedDesignDecisions: [],
      });
    });

    it('VALID: {SiegemasterWorkUnitStub} => parses successfully', () => {
      const stub = SiegemasterWorkUnitStub();

      expect(stub).toStrictEqual({
        role: 'siegemaster',
        questId: QuestIdStub({ value: 'add-auth' }),
        flow: FlowStub(),
        relatedDesignDecisions: [],
      });
    });

    it('VALID: {siegemaster with devServerUrl} => parses with devServerUrl', () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const flow = FlowStub();

      const result = workUnitContract.parse({
        role: 'siegemaster',
        questId,
        flow,
        devServerUrl: 'http://localhost:3000',
      });

      expect(result).toStrictEqual({
        role: 'siegemaster',
        questId,
        flow,
        relatedDesignDecisions: [],
        devServerUrl: 'http://localhost:3000',
      });
    });

    it('INVALID: {siegemaster with invalid devServerUrl} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'siegemaster',
          questId: QuestIdStub({ value: 'add-auth' }),
          flow: FlowStub(),
          devServerUrl: 'not-a-url',
        }),
      ).toThrow(/invalid_string/u);
    });

    it('INVALID: {siegemaster without flow} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'siegemaster',
          questId: QuestIdStub({ value: 'add-auth' }),
        }),
      ).toThrow(/required/iu);
    });
  });

  describe('blightwarden work unit', () => {
    it('VALID: {role: blightwarden, questId} => parses successfully with default relatedDesignDecisions', () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = workUnitContract.parse({
        role: 'blightwarden',
        questId,
      });

      expect(result).toStrictEqual({
        role: 'blightwarden',
        questId,
        relatedDesignDecisions: [],
      });
    });

    it('VALID: {BlightwardenWorkUnitStub} => parses successfully', () => {
      const stub = BlightwardenWorkUnitStub();

      expect(stub).toStrictEqual({
        role: 'blightwarden',
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedDesignDecisions: [],
      });
    });

    it('VALID: {role: blightwarden, scopeSize: small} => parses with scopeSize', () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = workUnitContract.parse({
        role: 'blightwarden',
        questId,
        scopeSize: 'small',
      });

      expect(result).toStrictEqual({
        role: 'blightwarden',
        questId,
        scopeSize: 'small',
        relatedDesignDecisions: [],
      });
    });

    it('VALID: {role: blightwarden, scopeSize: medium} => parses with scopeSize', () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = workUnitContract.parse({
        role: 'blightwarden',
        questId,
        scopeSize: 'medium',
      });

      expect(result).toStrictEqual({
        role: 'blightwarden',
        questId,
        scopeSize: 'medium',
        relatedDesignDecisions: [],
      });
    });

    it('VALID: {role: blightwarden, scopeSize: large} => parses with scopeSize', () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = workUnitContract.parse({
        role: 'blightwarden',
        questId,
        scopeSize: 'large',
      });

      expect(result).toStrictEqual({
        role: 'blightwarden',
        questId,
        scopeSize: 'large',
        relatedDesignDecisions: [],
      });
    });

    it('INVALID: {blightwarden with invalid scopeSize} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'blightwarden',
          questId: QuestIdStub({ value: 'add-auth' }),
          scopeSize: 'huge',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {blightwarden without questId} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'blightwarden',
        }),
      ).toThrow(/required/iu);
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

    it('INVALID: {lawbringer fields with codeweaver steps} => throws validation error', () => {
      expect(() =>
        workUnitContract.parse({
          role: 'lawbringer',
          steps: [DependencyStepStub()],
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
