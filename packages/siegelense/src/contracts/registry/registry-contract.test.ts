import { registryContract } from './registry-contract';
import { RegistryStub } from './registry.stub';
import { RegistryEntryStub } from '../registry-entry/registry-entry.stub';

describe('registryContract', () => {
  describe('valid registries', () => {
    it('EMPTY: {instances: []} => parses', () => {
      const result = registryContract.parse({ instances: [] });

      expect(result).toStrictEqual({ instances: [] });
    });

    it('VALID: {instances: [one entry]} => parses a registry with one row', () => {
      const entry = RegistryEntryStub({
        id: 'inst_7f3a9c21',
        owner: '42781',
        questId: null,
        guildId: null,
        specName: 'dungeonmaster-stack',
        specHash: 'a3f9c2e1',
        pid: null,
        pgids: [],
        socketPath: null,
        ports: { api: 34_172, web: 34_173 },
        state: 'alive',
        reservedAtMs: 1_700_000_000_000,
        bootedAtMs: null,
        lastBeatMs: null,
        prunedAtMs: null,
        prunedByRule: null,
      });
      const registry = RegistryStub({ instances: [entry] });

      const result = registryContract.parse(registry);

      expect(result).toStrictEqual({
        instances: [
          {
            id: 'inst_7f3a9c21',
            owner: '42781',
            questId: null,
            guildId: null,
            specName: 'dungeonmaster-stack',
            specHash: 'a3f9c2e1',
            pid: null,
            pgids: [],
            socketPath: null,
            ports: { api: 34_172, web: 34_173 },
            branch: null,
            state: 'alive',
            reservedAtMs: 1_700_000_000_000,
            bootedAtMs: null,
            lastBeatMs: null,
            prunedAtMs: null,
            prunedByRule: null,
          },
        ],
      });
    });
  });

  describe('invalid registries', () => {
    it('INVALID: {missing instances} => throws Required', () => {
      expect(() => registryContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {instances: [row missing id]} => throws for an invalid row inside the list', () => {
      expect(() =>
        registryContract.parse({
          instances: [
            {
              owner: '42781',
              questId: null,
              guildId: null,
              specName: 'dungeonmaster-stack',
              specHash: 'a3f9c2e1',
              pid: null,
              pgids: [],
              socketPath: null,
              ports: { api: 34_172, web: 34_173 },
              state: 'alive',
              reservedAtMs: 1_700_000_000_000,
              bootedAtMs: null,
              lastBeatMs: null,
              prunedAtMs: null,
              prunedByRule: null,
            },
          ],
        }),
      ).toThrow(/Required/u);
    });
  });
});
