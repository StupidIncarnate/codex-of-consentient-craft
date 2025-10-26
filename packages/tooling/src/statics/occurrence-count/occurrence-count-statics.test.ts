import { occurrenceCountStatics } from './occurrence-count-statics';

describe('occurrenceCountStatics', () => {
  it('VALID: minimumForDuplicate => returns 2', () => {
    expect(occurrenceCountStatics.minimumForDuplicate).toBe(2);
  });
});
