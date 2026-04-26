import { NetworkPortStub } from '../network-port/network-port.stub';
import { projectConfigContract } from './project-config-contract';
import { ProjectConfigStub } from './project-config.stub';

describe('projectConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: empty object => parses successfully with no fields', () => {
      const result = projectConfigContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: dungeonmaster with port => parses successfully', () => {
      const port = NetworkPortStub({ value: 3737 });
      const config = ProjectConfigStub({ dungeonmaster: { port } });

      const result = projectConfigContract.parse(config);

      expect(result.dungeonmaster?.port).toBe(port);
    });

    it('VALID: dungeonmaster without port => parses successfully', () => {
      const config = ProjectConfigStub({ dungeonmaster: {} });

      const result = projectConfigContract.parse(config);

      expect(result.dungeonmaster).toStrictEqual({});
    });

    it('VALID: stub default => parses with no dungeonmaster field', () => {
      const config = ProjectConfigStub();

      const result = projectConfigContract.parse(config);

      expect(result.dungeonmaster).toBe(undefined);
    });
  });

  describe('invalid configs', () => {
    it('INVALID: dungeonmaster.port out of range => throws validation error', () => {
      expect(() => {
        projectConfigContract.parse({ dungeonmaster: { port: 99999 } });
      }).toThrow(/Number must be/u);
    });
  });
});
