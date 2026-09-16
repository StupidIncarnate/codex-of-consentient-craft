import { opDescribeTransformer } from './op-describe-transformer';
import { OpCreateStub } from '../../contracts/op-create/op-create.stub';
import { OpSetStub } from '../../contracts/op-set/op-set.stub';
import { OpRemoveStub } from '../../contracts/op-remove/op-remove.stub';
import { OpSaveRecordStub } from '../../contracts/op-save-record/op-save-record.stub';
import { OpExtraStub } from '../../contracts/op-extra/op-extra.stub';
import { OpFilterStub } from '../../contracts/op-filter/op-filter.stub';

describe('opDescribeTransformer', () => {
  describe('a create op', () => {
    it('VALID: {op: create quest[0:1]} => returns "create quest[0:1]"', () => {
      const result = opDescribeTransformer({ op: OpCreateStub({ ref: 'guild[0:0]/quest[0:1]' }) });

      expect(result).toBe('create guild[0:0]/quest[0:1]');
    });
  });

  describe('a set op', () => {
    it('VALID: {op: set on guild[0:0]/quest[0:2]} => returns "set guild[0:0]/quest[0:2]"', () => {
      const result = opDescribeTransformer({ op: OpSetStub({ ref: 'guild[0:0]/quest[0:2]' }) });

      expect(result).toBe('set guild[0:0]/quest[0:2]');
    });
  });

  describe('a remove op', () => {
    it('VALID: {op: remove guild[0:0]/quest[0:1]} => returns "remove guild[0:0]/quest[0:1]"', () => {
      const result = opDescribeTransformer({ op: OpRemoveStub({ ref: 'guild[0:0]/quest[0:1]' }) });

      expect(result).toBe('remove guild[0:0]/quest[0:1]');
    });
  });

  describe('a saveRecord op', () => {
    it('VALID: {op: saveRecord guild[0:0]/quest[0:2]} => returns "saveRecord guild[0:0]/quest[0:2]"', () => {
      const result = opDescribeTransformer({
        op: OpSaveRecordStub({ ref: 'guild[0:0]/quest[0:2]', name: 'third' }),
      });

      expect(result).toBe('saveRecord guild[0:0]/quest[0:2]');
    });
  });

  describe('a filter op scoped to a host', () => {
    it('VALID: {op: filter operation scoped to guild[0:0]/quest[0:0]} => returns "filter operation under guild[0:0]/quest[0:0]"', () => {
      const result = opDescribeTransformer({
        op: OpFilterStub({ ingredient: 'operation', scope: 'guild[0:0]/quest[0:0]' }),
      });

      expect(result).toBe('filter operation under guild[0:0]/quest[0:0]');
    });
  });

  describe('a filter op with no scope', () => {
    it('VALID: {op: filter operation with no scope} => returns "filter operation"', () => {
      const result = opDescribeTransformer({ op: OpFilterStub({ ingredient: 'operation' }) });

      expect(result).toBe('filter operation');
    });
  });

  describe('an extra op', () => {
    it('VALID: {op: extra withNestedChain on session[0:0]} => returns "extra withNestedChain session[0:0]"', () => {
      const result = opDescribeTransformer({
        op: OpExtraStub({ ref: 'session[0:0]', verb: 'withNestedChain' }),
      });

      expect(result).toBe('extra withNestedChain session[0:0]');
    });
  });
});
