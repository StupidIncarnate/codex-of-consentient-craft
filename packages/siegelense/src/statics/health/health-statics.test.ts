import { healthStatics } from './health-statics';

describe('healthStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(healthStatics).toStrictEqual({
      selectors: {
        root: '#root',
      },
      verdicts: {
        healthy: 'HEALTHY',
        degraded: 'DEGRADED',
        down: 'DOWN',
        all: ['HEALTHY', 'DEGRADED', 'DOWN'],
      },
      formatting: {
        separator: ' · ',
        rootPresent: 'root present',
        rootAbsent: 'root absent',
        notBlank: 'not blank',
        consoleClean: 'console clean',
        no5xx: 'no 5xx',
        serverClean: 'server log clean',
        verdictPaddedLength: 10,
      },
    });
  });

  it('VALID: {verdicts.all} => contains every verdict member', () => {
    expect(healthStatics.verdicts.all).toStrictEqual(['HEALTHY', 'DEGRADED', 'DOWN']);
  });
});
