import {
  AbsoluteFilePathStub,
  ContextStub,
  DependencyStepStub,
  ErrorMessageStub,
  ObservableStub,
  QuestContractEntryStub,
  QuestIdStub,
  RequirementStub,
  VerificationStepStub,
} from '@dungeonmaster/shared/contracts';

import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
} from '../../contracts/work-unit/work-unit.stub';
import { workUnitToArgumentsTransformer } from './work-unit-to-arguments-transformer';

describe('workUnitToArgumentsTransformer', () => {
  describe('codeweaver role', () => {
    it('VALID: {codeweaver with minimal step} => returns step name and description', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Auth Broker',
          description: 'Implements authentication logic',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Step: Create Auth Broker\nDescription: Implements authentication logic\nQuest ID: add-auth',
      );
    });

    it('VALID: {codeweaver with exportName} => includes export name', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Auth Broker',
          description: 'Auth logic',
          exportName: 'authBroker',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'add-auth' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /^Step: Create Auth Broker\nDescription: Auth logic\nExport Name: authBroker\nQuest ID: add-auth$/u,
      );
    });

    it('VALID: {codeweaver with filesToCreate} => includes files to create list', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Create Broker',
          description: 'Broker',
          filesToCreate: ['src/broker.ts', 'src/broker.test.ts'],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /Files to Create:\n {2}- src\/broker\.ts\n {2}- src\/broker\.test\.ts/u,
      );
    });

    it('VALID: {codeweaver with filesToModify} => includes files to modify list', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Update Broker',
          description: 'Update',
          filesToCreate: [],
          filesToModify: ['src/existing.ts'],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/Files to Modify:\n {2}- src\/existing\.ts/u);
    });

    it('VALID: {codeweaver with related contracts} => includes contract details', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [
          QuestContractEntryStub({
            name: 'LoginCredentials',
            kind: 'data',
            properties: [{ name: 'email', type: 'EmailAddress', description: 'User email' }],
          }),
        ],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /Related Contracts:\n {2}- LoginCredentials \(data\)\n {4}- email \(EmailAddress\) - User email/u,
      );
    });

    it('VALID: {codeweaver with contract property having type but no description} => formats name with type only', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [
          QuestContractEntryStub({
            name: 'TypeOnlyContract',
            kind: 'data',
            properties: [{ name: 'userId', type: 'UserId' }],
          }),
        ],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/ {4}- userId \(UserId\)$/mu);
    });

    it('VALID: {codeweaver with contract property having description but no type} => formats name with description only', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [
          QuestContractEntryStub({
            name: 'DescOnlyContract',
            kind: 'data',
            properties: [{ name: 'email', description: 'The user email address' }],
          }),
        ],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/ {4}- email - The user email address$/mu);
    });

    it('VALID: {codeweaver with contract property without type/description} => formats name only', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [
          QuestContractEntryStub({
            name: 'SimpleContract',
            kind: 'data',
            properties: [{ name: 'id' }],
          }),
        ],
        relatedObservables: [],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/ {4}- id$/mu);
    });

    it('VALID: {codeweaver with related observables} => includes observable details', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [
          ObservableStub({
            trigger: 'User clicks login',
            outcomes: [{ type: 'api-call', description: 'POST /auth/login', criteria: {} }],
          }),
        ],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(
        /Related Observables:\n {2}- Trigger: User clicks login\n {4}- api-call: POST \/auth\/login/u,
      );
    });

    it('VALID: {codeweaver with observable verification steps} => includes verification details', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [
          ObservableStub({
            trigger: 'User clicks login',
            outcomes: [{ type: 'ui-state', description: 'Redirected to /dashboard', criteria: {} }],
            verification: [
              VerificationStepStub({
                action: 'navigate',
                target: '/login',
                value: undefined,
                condition: undefined,
                type: undefined,
              }),
              VerificationStepStub({
                action: 'click',
                target: 'submit button',
                value: undefined,
                condition: undefined,
                type: undefined,
              }),
              VerificationStepStub({
                action: 'assert',
                target: 'window.location',
                value: '/dashboard',
                condition: 'equals',
                type: 'ui-state',
              }),
            ],
          }),
        ],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/Verification:/u);
      expect(result).toMatch(/ {6}- navigate \/login$/mu);
      expect(result).toMatch(/ {6}- click submit button$/mu);
      expect(result).toMatch(
        / {6}- assert window\.location = \/dashboard \[equals\] \(ui-state\)$/mu,
      );
    });

    it('VALID: {codeweaver with observable without verification} => omits verification section', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [
          ObservableStub({
            trigger: 'User clicks login',
            outcomes: [{ type: 'api-call', description: 'POST /auth/login', criteria: {} }],
            verification: [],
          }),
        ],
        relatedRequirements: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).not.toMatch(/Verification:/u);
      expect(result).toMatch(/api-call: POST \/auth\/login/u);
    });

    it('VALID: {codeweaver with related requirements} => includes requirement details', () => {
      const workUnit = CodeweaverWorkUnitStub({
        step: DependencyStepStub({
          name: 'Step',
          description: 'Desc',
          filesToCreate: [],
          filesToModify: [],
        }),
        questId: QuestIdStub({ value: 'quest-1' }),
        relatedContracts: [],
        relatedObservables: [],
        relatedRequirements: [
          RequirementStub({ name: 'Auth Support', description: 'Add authentication' }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/Related Requirements:\n {2}- Auth Support: Add authentication/u);
    });
  });

  describe('siegemaster role', () => {
    it('VALID: {siegemaster with observables and contexts} => returns formatted quest context', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'verify-quest' }),
        observables: [
          ObservableStub({
            contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits form',
            outcomes: [{ type: 'ui-state', description: 'Shows success message', criteria: {} }],
          }),
        ],
        contexts: [ContextStub({ name: 'Login Page', description: 'Main login form' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Quest ID: verify-quest\n' +
          'Observables:\n' +
          '  - [f47ac10b-58cc-4372-a567-0e02b2c3d479] User submits form\n' +
          '    - ui-state: Shows success message\n' +
          'Contexts:\n' +
          '  - Login Page: Main login form',
      );
    });

    it('VALID: {siegemaster with observable verification steps} => includes verification details', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'verify-quest' }),
        observables: [
          ObservableStub({
            contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits form',
            outcomes: [{ type: 'ui-state', description: 'Shows success message', criteria: {} }],
            verification: [
              VerificationStepStub({
                action: 'fill',
                target: 'name input',
                value: 'John',
                condition: undefined,
                type: undefined,
              }),
              VerificationStepStub({
                action: 'click',
                target: 'submit',
                value: undefined,
                condition: undefined,
                type: undefined,
              }),
              VerificationStepStub({
                action: 'assert',
                target: 'toast',
                value: 'Success',
                condition: 'contains',
                type: 'ui-state',
              }),
            ],
          }),
        ],
        contexts: [ContextStub({ name: 'Form Page', description: 'Main form' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toMatch(/Verification:/u);
      expect(result).toMatch(/ {6}- fill name input = John$/mu);
      expect(result).toMatch(/ {6}- click submit$/mu);
      expect(result).toMatch(/ {6}- assert toast = Success \[contains\] \(ui-state\)$/mu);
    });

    it('VALID: {siegemaster with empty observables and contexts} => returns quest ID only', () => {
      const workUnit = SiegemasterWorkUnitStub({
        questId: QuestIdStub({ value: 'empty-quest' }),
        observables: [],
        contexts: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Quest ID: empty-quest');
    });
  });

  describe('lawbringer role', () => {
    it('VALID: {lawbringer with file paths} => returns files to review', () => {
      const workUnit = LawbringerWorkUnitStub({
        filePaths: [
          AbsoluteFilePathStub({ value: '/src/broker.ts' }),
          AbsoluteFilePathStub({ value: '/src/broker.test.ts' }),
        ],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Files to Review:\n  - /src/broker.ts\n  - /src/broker.test.ts');
    });

    it('EDGE: {lawbringer with empty filePaths} => returns header only with no file entries', () => {
      const workUnit = LawbringerWorkUnitStub({
        filePaths: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Files to Review:');
    });
  });

  describe('spiritmender role', () => {
    it('VALID: {spiritmender with errors} => returns file paths and errors', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
        errors: [ErrorMessageStub({ value: 'Missing return type' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/broken.ts\nErrors:\n  - Missing return type\nRun npm run ward on the files to verify fixes.',
      );
    });

    it('VALID: {spiritmender with empty errors array} => returns file paths without errors section', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
        errors: [],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/file.ts\nRun npm run ward on the files to verify fixes.',
      );
    });

    it('VALID: {spiritmender with errors field omitted} => returns file paths without errors section', () => {
      const workUnit = SpiritmenderWorkUnitStub({
        filePaths: [AbsoluteFilePathStub({ value: '/src/broken.ts' })],
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe(
        'Files:\n  - /src/broken.ts\nRun npm run ward on the files to verify fixes.',
      );
    });
  });

  describe('pathseeker role', () => {
    it('VALID: {pathseeker} => returns quest ID', () => {
      const workUnit = PathseekerWorkUnitStub({
        questId: QuestIdStub({ value: 'my-quest' }),
      });

      const result = workUnitToArgumentsTransformer({ workUnit });

      expect(result).toBe('Quest ID: my-quest');
    });
  });
});
