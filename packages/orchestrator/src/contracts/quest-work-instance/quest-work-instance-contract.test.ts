import { questWorkInstanceContract } from './quest-work-instance-contract';
import { QuestWorkInstanceStub } from './quest-work-instance.stub';

describe('questWorkInstanceContract', () => {
  describe('valid instance', () => {
    it('VALID: {a browsered manifest} => parses with baseUrl and apiUrl present', () => {
      const instance = QuestWorkInstanceStub({
        instanceId: 'inst_7f3a9c21',
        baseUrl: 'http://localhost:34173',
        apiUrl: 'http://localhost:34170',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        logs: {
          api: '/repo/.siegelense/g1/instances/inst_7f3a9c21/api-server.log',
          web: '/repo/.siegelense/g1/instances/inst_7f3a9c21/web-server.log',
        },
      });

      const result = questWorkInstanceContract.parse(instance);

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        baseUrl: 'http://localhost:34173',
        apiUrl: 'http://localhost:34170',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        logs: {
          api: '/repo/.siegelense/g1/instances/inst_7f3a9c21/api-server.log',
          web: '/repo/.siegelense/g1/instances/inst_7f3a9c21/web-server.log',
        },
      });
    });

    it('VALID: {a browserless manifest} => baseUrl null means no web surface, not a failure', () => {
      const instance = QuestWorkInstanceStub({ baseUrl: null });

      const result = questWorkInstanceContract.parse(instance);

      expect(result.baseUrl).toBe(null);
    });
  });

  describe('empty apiUrl', () => {
    it('EMPTY: {apiUrl: null} => parses, since `start` does not always populate it', () => {
      const instance = QuestWorkInstanceStub({ apiUrl: null });

      const result = questWorkInstanceContract.parse(instance);

      expect(result.apiUrl).toBe(null);
    });
  });

  describe('invalid instance', () => {
    it('INVALID: {instanceId: "not-an-inst-id"} => throws on the siege instance id format', () => {
      expect(() =>
        questWorkInstanceContract.parse(
          QuestWorkInstanceStub({ instanceId: 'not-an-inst-id' as never }),
        ),
      ).toThrow(/Siege instance id must look like/u);
    });

    it('INVALID: {home missing} => throws Required', () => {
      const instance = QuestWorkInstanceStub();

      expect(() => questWorkInstanceContract.parse({ ...instance, home: undefined })).toThrow(
        /Required/u,
      );
    });
  });
});
