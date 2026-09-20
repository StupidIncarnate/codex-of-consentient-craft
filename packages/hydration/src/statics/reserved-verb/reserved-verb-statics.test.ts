import { reservedVerbStatics } from './reserved-verb-statics';

describe('reservedVerbStatics', () => {
  it('VALID: {} => holds exactly set, setRaw, remove, saveRecordAs', () => {
    expect(reservedVerbStatics).toStrictEqual({
      verbs: ['set', 'setRaw', 'remove', 'saveRecordAs'],
    });
  });
});
