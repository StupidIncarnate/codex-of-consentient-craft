import { fromSavedRefTransformer } from './from-saved-ref-transformer';

describe('fromSavedRefTransformer', () => {
  it('VALID: {name: origin, field: sessionId} => returns the saved ref with both keys', () => {
    const result = fromSavedRefTransformer({
      name: 'origin',
      field: 'sessionId',
    });

    expect(result).toStrictEqual({ __savedRef: true, name: 'origin', field: 'sessionId' });
  });

  it('VALID: {name: origin} => returns the saved ref with no field key', () => {
    const result = fromSavedRefTransformer({
      name: 'origin',
    });

    expect(result).toStrictEqual({ __savedRef: true, name: 'origin' });
  });
});
