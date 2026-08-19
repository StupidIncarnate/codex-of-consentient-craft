import { healthErrorStatics } from './health-error-statics';

describe('healthErrorStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(healthErrorStatics).toStrictEqual({
      socketClosedMessage: 'WebSocket connection lost',
      labels: {
        connectionLost: 'CONNECTION LOST',
        noResponse: 'NO RESPONSE',
        httpPrefix: 'HTTP ',
      },
    });
  });
});
