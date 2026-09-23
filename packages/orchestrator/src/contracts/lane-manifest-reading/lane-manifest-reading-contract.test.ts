import { laneManifestReadingContract } from './lane-manifest-reading-contract';
import { LaneManifestReadingStub } from './lane-manifest-reading.stub';

describe('laneManifestReadingContract', () => {
  describe('valid manifest', () => {
    it('VALID: {a browsered manifest} => parses with nested log entries intact', () => {
      const manifest = LaneManifestReadingStub();

      const result = laneManifestReadingContract.parse(manifest);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        baseUrl: 'http://localhost:34173',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        logs: {
          api: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/api-server.log',
            linkPresent: true,
          },
          web: {
            path: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/web-server.log',
            linkPresent: true,
          },
        },
      });
    });
  });

  describe('empty apiUrl', () => {
    it('EMPTY: {apiUrl omitted} => parses — instanceStartBroker never sets this field', () => {
      const manifest = LaneManifestReadingStub();

      const result = laneManifestReadingContract.parse(manifest);

      expect(result.apiUrl).toBe(undefined);
    });
  });

  describe('browserless manifest', () => {
    it('VALID: {baseUrl: null} => parses — a browserless spec never claims a web surface', () => {
      const manifest = LaneManifestReadingStub({ baseUrl: null });

      const result = laneManifestReadingContract.parse(manifest);

      expect(result.baseUrl).toBe(null);
    });
  });

  describe('invalid manifest', () => {
    it('INVALID: {logs.api not nested} => throws when the log entry is a bare string', () => {
      const manifest = LaneManifestReadingStub();

      expect(() =>
        laneManifestReadingContract.parse({
          ...manifest,
          logs: {
            ...manifest.logs,
            api: '/repo/.dungeonmaster-assets/siegelense-assets/g1/instances/inst_7f3a9c21/api-server.log',
          },
        }),
      ).toThrow(/Expected object/u);
    });
  });
});
