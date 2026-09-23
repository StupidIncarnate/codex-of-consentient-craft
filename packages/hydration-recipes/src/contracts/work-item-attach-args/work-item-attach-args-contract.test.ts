import { SavedRefStub } from '@dungeonmaster/hydration/contracts';

import { workItemAttachArgsContract } from './work-item-attach-args-contract';
import { WorkItemAttachArgsStub } from './work-item-attach-args.stub';

describe('workItemAttachArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {operationId: a real OperationItemId string} => parses successfully', () => {
      const args = WorkItemAttachArgsStub({
        operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const result = workItemAttachArgsContract.parse(args);

      expect(result).toStrictEqual({
        role: 'codeweaver',
        status: 'complete',
        spawnerType: 'agent',
        createdAt: '2024-01-01T00:00:00.000Z',
        operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });

    it('VALID: {operationId: a SavedRef} => parses successfully, keeping the ref unresolved', () => {
      const savedRef = SavedRefStub({ name: 'codeweaverOperation', field: 'id' });
      const args = WorkItemAttachArgsStub({ operationId: savedRef });

      const result = workItemAttachArgsContract.parse(args);

      expect(result).toStrictEqual({
        role: 'codeweaver',
        status: 'complete',
        spawnerType: 'agent',
        createdAt: '2024-01-01T00:00:00.000Z',
        operationId: { __savedRef: true, name: 'codeweaverOperation', field: 'id' },
      });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {role: missing} => throws Required', () => {
      expect(() =>
        workItemAttachArgsContract.parse({
          status: 'complete',
          spawnerType: 'agent',
          createdAt: '2024-01-01T00:00:00.000Z',
          operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {operationId: neither an OperationItemId nor a SavedRef} => throws', () => {
      expect(() =>
        workItemAttachArgsContract.parse({
          role: 'codeweaver',
          status: 'complete',
          spawnerType: 'agent',
          createdAt: '2024-01-01T00:00:00.000Z',
          operationId: 'not-a-uuid-or-ref',
        }),
      ).toThrow(/Invalid/u);
    });
  });
});
