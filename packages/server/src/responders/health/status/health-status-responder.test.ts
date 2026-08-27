import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { HealthStatusResponderProxy } from './health-status-responder.proxy';

describe('HealthStatusResponder', () => {
  describe('successful snapshot', () => {
    it('VALID: {broker returns snapshot} => returns 200 with the snapshot passed through as data unchanged', () => {
      const proxy = HealthStatusResponderProxy();
      proxy.setupSnapshot({ uptimeSeconds: 120, version: '1.0.0' });

      const result = proxy.callResponder();

      expect(result).toStrictEqual({
        status: 200,
        data: HealthStatusPayloadStub({ status: 'ok', uptimeSeconds: 120, version: '1.0.0' }),
      });
    });
  });

  describe('broker throws', () => {
    it('ERROR: {broker throws} => returns 500 with an error message rather than propagating', () => {
      const proxy = HealthStatusResponderProxy();
      proxy.setupBrokerThrows();

      const result = proxy.callResponder();

      expect(result).toStrictEqual({
        status: 500,
        data: {
          error:
            '[\n' +
            '  {\n' +
            '    "code": "too_small",\n' +
            '    "minimum": 0,\n' +
            '    "type": "number",\n' +
            '    "inclusive": true,\n' +
            '    "exact": false,\n' +
            '    "message": "Number must be greater than or equal to 0",\n' +
            '    "path": []\n' +
            '  }\n' +
            ']',
        },
      });
    });
  });
});
