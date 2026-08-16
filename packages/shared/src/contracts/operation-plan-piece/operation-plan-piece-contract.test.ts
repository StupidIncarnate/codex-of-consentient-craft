import { operationPlanPieceContract } from './operation-plan-piece-contract';
import { OperationPlanPieceStub } from './operation-plan-piece.stub';

describe('operationPlanPieceContract', () => {
  describe('valid pieces', () => {
    it('VALID: {defaults} => parses with files, folderTypes, unitIds, dependsOn defaulting to empty and status pending', () => {
      const piece = OperationPlanPieceStub();

      expect(piece).toStrictEqual({
        id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
        title: 'Branded id contract',
        intent:
          'operationPlanPieceIdContract exists, is branded uuid, and round-trips through its stub',
        files: [],
        folderTypes: [],
        unitIds: [],
        dependsOn: [],
        status: 'pending',
      });
    });

    it('VALID: {files, folderTypes} => parses the file the piece owns alongside its folder type', () => {
      const piece = OperationPlanPieceStub({
        files: ['./src/contracts/operation-plan-piece-id/operation-plan-piece-id-contract.ts'],
        folderTypes: ['contracts'],
      });

      expect(piece).toStrictEqual({
        id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
        title: 'Branded id contract',
        intent:
          'operationPlanPieceIdContract exists, is branded uuid, and round-trips through its stub',
        files: ['./src/contracts/operation-plan-piece-id/operation-plan-piece-id-contract.ts'],
        folderTypes: ['contracts'],
        unitIds: [],
        dependsOn: [],
        status: 'pending',
      });
    });

    it('VALID: {unitIds: two checklist ids} => parses the units this piece settles', () => {
      const piece = OperationPlanPieceStub({
        unitIds: [
          'view-persisted-comments:observable:check-badge-count-text',
          'packages/web/src/x.tsx:craft',
        ],
      });

      expect(piece.unitIds).toStrictEqual([
        'view-persisted-comments:observable:check-badge-count-text',
        'packages/web/src/x.tsx:craft',
      ]);
    });

    it('VALID: {dependsOn: one piece id} => parses the ordering reference', () => {
      const piece = OperationPlanPieceStub({
        dependsOn: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
      });

      expect(piece.dependsOn).toStrictEqual(['f47ac10b-58cc-4372-a567-0e02b2c3d479']);
    });

    it('VALID: {mirror} => parses the sibling file to follow', () => {
      const piece = OperationPlanPieceStub({
        mirror: './src/contracts/operation-item-id/operation-item-id-contract.ts',
      });

      expect(piece.mirror).toBe('./src/contracts/operation-item-id/operation-item-id-contract.ts');
    });

    it('VALID: {mirror omitted} => leaves it undefined', () => {
      const piece = OperationPlanPieceStub();

      expect(piece.mirror).toBe(undefined);
    });

    it('VALID: {notes} => parses spike findings', () => {
      const piece = OperationPlanPieceStub({
        notes: 'The existing sibling uses z.string().uuid() rather than a regex; follow that.',
      });

      expect(piece.notes).toBe(
        'The existing sibling uses z.string().uuid() rather than a regex; follow that.',
      );
    });

    it('VALID: {notes omitted} => leaves it undefined', () => {
      const piece = OperationPlanPieceStub();

      expect(piece.notes).toBe(undefined);
    });

    it('VALID: {status: done} => parses a settled piece', () => {
      const piece = OperationPlanPieceStub({ status: 'done' });

      expect(piece.status).toBe('done');
    });

    it('VALID: {status: rejected} => parses a rejected piece', () => {
      const piece = OperationPlanPieceStub({ status: 'rejected' });

      expect(piece.status).toBe('rejected');
    });
  });

  describe('invalid pieces', () => {
    it('EMPTY: {title: ""} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ title: '' as never });
      }).toThrow(/too_small/u);
    });

    it('EMPTY: {intent: ""} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ intent: '' as never });
      }).toThrow(/too_small/u);
    });

    it('EMPTY: {folderTypes: [""]} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ folderTypes: [''] });
      }).toThrow(/too_small/u);
    });

    it('EMPTY: {unitIds: [""]} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ unitIds: [''] });
      }).toThrow(/too_small/u);
    });

    it('EMPTY: {notes: ""} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ notes: '' as never });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return operationPlanPieceContract.parse({
          id: 'not-a-uuid',
          title: 'Branded id contract',
          intent: 'operationPlanPieceIdContract exists',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {dependsOn: ["not-a-uuid"]} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ dependsOn: ['not-a-uuid'] });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {status: "in-flight"} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ status: 'in-flight' as never });
      }).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {files: ["relative/no-prefix.ts"]} => throws validation error', () => {
      expect(() => {
        return OperationPlanPieceStub({ files: ['relative/no-prefix.ts'] });
      }).toThrow(/Path must be absolute/u);
    });
  });
});
