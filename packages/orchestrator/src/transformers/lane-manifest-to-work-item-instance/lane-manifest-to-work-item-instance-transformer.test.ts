import { LaneManifestReadingStub } from '../../contracts/lane-manifest-reading/lane-manifest-reading.stub';
import { laneManifestToWorkItemInstanceTransformer } from './lane-manifest-to-work-item-instance-transformer';

describe('laneManifestToWorkItemInstanceTransformer', () => {
  describe('a browsered manifest', () => {
    it('VALID: {manifest with baseUrl and nested log entries} => extracts bare log paths', () => {
      const manifest = LaneManifestReadingStub();

      const result = laneManifestToWorkItemInstanceTransformer({ manifest });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        baseUrl: 'http://localhost:34173',
        apiUrl: null,
        home: '/tmp/dm-siege-inst_7f3a9c21',
        logs: {
          api: '/repo/.siegelense/g1/instances/inst_7f3a9c21/api-server.log',
          web: '/repo/.siegelense/g1/instances/inst_7f3a9c21/web-server.log',
        },
      });
    });
  });

  describe('a browserless manifest', () => {
    it('VALID: {baseUrl: null} => carries the null through, never a placeholder URL', () => {
      const manifest = LaneManifestReadingStub({ baseUrl: null });

      const result = laneManifestToWorkItemInstanceTransformer({ manifest });

      expect(result.baseUrl).toBe(null);
    });
  });

  describe('an absent apiUrl', () => {
    it('EMPTY: {apiUrl omitted from the raw manifest} => becomes an explicit null', () => {
      const manifest = LaneManifestReadingStub();

      const result = laneManifestToWorkItemInstanceTransformer({ manifest });

      expect(result.apiUrl).toBe(null);
    });
  });
});
