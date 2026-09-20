import { rowRefStatics } from './row-ref-statics';

describe('rowRefStatics', () => {
  it('VALID: {} => holds exactly the slot separator and the match word', () => {
    expect(rowRefStatics).toStrictEqual({ slot: { separator: ':', matchWord: 'match' } });
  });
});
