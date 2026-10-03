import { GuildStub } from '../guild/guild.stub';
import { homeConfigContract } from './home-config-contract';
import { HomeConfigStub } from './home-config.stub';

describe('homeConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: empty guilds => parses successfully', () => {
      const config = HomeConfigStub();

      const result = homeConfigContract.parse(config);

      expect(result).toStrictEqual({
        guilds: [],
      });
    });

    it('VALID: config with guilds => parses successfully', () => {
      const guild = GuildStub();
      const config = HomeConfigStub({
        guilds: [guild],
      });

      const result = homeConfigContract.parse(config);

      expect(result.guilds).toStrictEqual([guild]);
    });

    it('VALID: missing guilds field => defaults to empty array', () => {
      const result = homeConfigContract.parse({});

      expect(result.guilds).toStrictEqual([]);
    });

    it('VALID: absent resources => resources is undefined', () => {
      const config = HomeConfigStub();

      const result = homeConfigContract.parse(config);

      expect(result.resources).toBe(undefined);
    });

    it('VALID: config with valid resources => parses successfully', () => {
      const config = HomeConfigStub({
        resources: {
          maxMemoryPercent: 75,
          maxCpuPercent: 70,
          maxDiskMB: 8192,
        },
      });

      const result = homeConfigContract.parse(config);

      expect(result.resources).toStrictEqual({
        maxMemoryPercent: 75,
        maxCpuPercent: 70,
        maxDiskMB: 8192,
      });
    });
  });

  describe('invalid configs', () => {
    it('INVALID: invalid guild in array => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          guilds: [{ id: 'not-a-uuid' }],
        });
      }).toThrow(/Invalid UUID/u);
    });

    it('INVALID: maxMemoryPercent below min (9) => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          resources: {
            maxMemoryPercent: 9,
          },
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: maxMemoryPercent above max (101) => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          resources: {
            maxMemoryPercent: 101,
          },
        });
      }).toThrow(/too_big/u);
    });

    it('INVALID: maxCpuPercent below min (9) => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          resources: {
            maxCpuPercent: 9,
          },
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: maxCpuPercent above max (91) => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          resources: {
            maxCpuPercent: 91,
          },
        });
      }).toThrow(/too_big/u);
    });

    it('INVALID: maxDiskMB below min (1023) => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          resources: {
            maxDiskMB: 1023,
          },
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: non-integer maxMemoryPercent => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          resources: {
            maxMemoryPercent: 75.5,
          },
        });
      }).toThrow(/expected int/u);
    });

    it('INVALID: non-integer maxDiskMB => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          resources: {
            maxDiskMB: 2048.5,
          },
        });
      }).toThrow(/expected int/u);
    });
  });
});
