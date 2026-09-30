import { opSaveRecordTransformer } from './op-save-record-transformer';

describe('opSaveRecordTransformer', () => {
  it('VALID: {ref: guild[0:0]/quest[0:2], name: third} => returns the whole saveRecord op', () => {
    const result = opSaveRecordTransformer({
      ref: 'guild[0:0]/quest[0:2]',
      name: 'third',
    });

    expect(result).toStrictEqual({ op: 'saveRecord', ref: 'guild[0:0]/quest[0:2]', name: 'third' });
  });
});
