import { occurrenceCountStatics } from './occurrence-count-statics';

describe('occurrenceCountStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(occurrenceCountStatics).toStrictEqual({
      minimumForDuplicate: 2,
    });
  });
});
