import { opSaveRecordTransformer } from './op-save-record-transformer';
import { RowRefStub } from '../../contracts/row-ref/row-ref.stub';
import { SavedRecordNameStub } from '../../contracts/saved-record-name/saved-record-name.stub';

describe('opSaveRecordTransformer', () => {
  it('VALID: {ref: guild[0:0]/quest[0:2], name: third} => returns the whole saveRecord op', () => {
    const result = opSaveRecordTransformer({
      ref: RowRefStub({ value: 'guild[0:0]/quest[0:2]' }),
      name: SavedRecordNameStub({ value: 'third' }),
    });

    expect(result).toStrictEqual({ op: 'saveRecord', ref: 'guild[0:0]/quest[0:2]', name: 'third' });
  });
});
