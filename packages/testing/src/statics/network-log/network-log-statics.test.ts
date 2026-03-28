import { networkLogStatics } from './network-log-statics';

describe('networkLogStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(networkLogStatics).toStrictEqual({
      limits: {
        maxEntries: 50,
        maxBodyLength: 1500,
      },
      delimiters: {
        start: '__NETWORK_LOG__',
        end: '__NETWORK_LOG_END__',
      },
      filters: {
        apiPathFilter: '/api/',
      },
      formatting: {
        methodPadWidth: 4,
        noBodyPlaceholder: '(no body)',
        unknownStatus: '???',
      },
    });
  });
});
