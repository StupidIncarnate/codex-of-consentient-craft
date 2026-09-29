import { now, nowIso } from './Date';

describe('#gateway/browser/Date', () => {
  it('VALID: {barrel} => re-exports now and nowIso as functions', () => {
    expect({ now, nowIso }).toStrictEqual({
      now: expect.any(Function),
      nowIso: expect.any(Function),
    });
  });
});
