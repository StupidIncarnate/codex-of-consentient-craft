import { nondeterministicCallWatchlistStatics } from './nondeterministic-call-watchlist-statics';

describe('nondeterministicCallWatchlistStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(nondeterministicCallWatchlistStatics).toStrictEqual({
      bannedCalls: [
        { objectName: 'Date', propertyName: 'now' },
        { objectName: 'Math', propertyName: 'random' },
        { objectName: 'crypto', propertyName: 'randomUUID' },
      ],
    });
  });
});
