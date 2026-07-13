import { operationItemContract } from './operation-item-contract';
import { OperationItemStub } from './operation-item.stub';

describe('operationItemContract', () => {
  describe('valid items', () => {
    it('VALID: {role: codeweaver, status: pending} => parses with locked defaulting to false', () => {
      const item = OperationItemStub();

      expect(item).toStrictEqual({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'pending',
        locked: false,
      });
    });

    it('VALID: {role: ward, wardMode: changed, locked: true} => parses ward item', () => {
      const item = OperationItemStub({
        role: 'ward',
        text: 'ward (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });

      expect(item).toStrictEqual({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'ward',
        text: 'ward (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
    });

    it('VALID: {status: complete, text: pt 2 continuation} => parses continuation item', () => {
      const item = OperationItemStub({
        text: 'pt 2: core: config load+validate adapter',
        status: 'complete',
      });

      expect(item).toStrictEqual({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        text: 'pt 2: core: config load+validate adapter',
        status: 'complete',
        locked: false,
      });
    });
  });

  describe('invalid items', () => {
    it('INVALID: {status: partial} => throws validation error', () => {
      expect(() => {
        return operationItemContract.parse({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
          status: 'partial',
        });
      }).toThrow(/invalid_enum_value/u);
    });

    it('INVALID: {role: pathseeker} => throws validation error', () => {
      expect(() => {
        return operationItemContract.parse({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          role: 'pathseeker',
          text: 'plan the quest',
          status: 'pending',
        });
      }).toThrow(/invalid_enum_value/u);
    });

    it('EMPTY: {text: ""} => throws validation error', () => {
      expect(() => {
        return OperationItemStub({ text: '' as never });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {wardMode: partial-run} => throws validation error', () => {
      expect(() => {
        return OperationItemStub({ wardMode: 'partial-run' as never });
      }).toThrow(/invalid_enum_value/u);
    });
  });
});
