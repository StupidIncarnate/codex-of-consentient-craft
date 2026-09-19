import { dmTargetContract } from './dm-target-contract';
import { DmTargetStub } from './dm-target.stub';

type DmTarget = ReturnType<typeof DmTargetStub>;

describe('dmTargetContract', () => {
  describe('valid targets', () => {
    it('VALID: {home, claudeHome} => parses to exactly those two fields', () => {
      const result = dmTargetContract.parse({ home: '/tmp/a', claudeHome: '/tmp/a' });

      expect(result).toStrictEqual({ home: '/tmp/a', claudeHome: '/tmp/a' });
    });

    it('VALID: {home, claudeHome, baseUrl, request} => parses and preserves the request reference', () => {
      const request = async () => Promise.resolve({ status: 201, body: {} });

      const result = dmTargetContract.parse({
        home: '/tmp/a',
        claudeHome: '/tmp/a',
        baseUrl: 'http://app.in-process',
        request,
      });

      expect(result).toStrictEqual({
        home: '/tmp/a',
        claudeHome: '/tmp/a',
        baseUrl: 'http://app.in-process',
        request,
      });
    });

    it('VALID: {stub with home override} => parses with the overridden home', () => {
      const target: DmTarget = DmTargetStub({ home: '/tmp/guild-2', claudeHome: '/tmp/guild-2' });

      expect(target).toStrictEqual({ home: '/tmp/guild-2', claudeHome: '/tmp/guild-2' });
    });
  });

  describe('invalid targets', () => {
    it('INVALID: {home: "relative/path"} => throws "Path must be absolute"', () => {
      expect(() => dmTargetContract.parse({ home: 'relative/path', claudeHome: '/tmp/a' })).toThrow(
        /Path must be absolute/u,
      );
    });

    it('INVALID: {baseUrl: "not-a-url"} => throws "Invalid url"', () => {
      expect(() =>
        dmTargetContract.parse({ home: '/tmp/a', claudeHome: '/tmp/a', baseUrl: 'not-a-url' }),
      ).toThrow(/Invalid url/u);
    });

    it('INVALID: {request: "nope"} => throws "Expected a request function"', () => {
      expect(() =>
        dmTargetContract.parse({
          home: '/tmp/a',
          claudeHome: '/tmp/a',
          baseUrl: 'http://app.in-process',
          request: 'nope' as never,
        }),
      ).toThrow(/Expected a request function/u);
    });

    it('INVALID: {request present, baseUrl absent} => throws "a request function needs a baseUrl"', () => {
      const request = async () => Promise.resolve({ status: 200, body: {} });

      expect(() =>
        dmTargetContract.parse({ home: '/tmp/a', claudeHome: '/tmp/a', request }),
      ).toThrow(/a request function needs a baseUrl/u);
    });
  });

  describe('empty target', () => {
    it('EMPTY: {} => throws "Required" for both home and claudeHome', () => {
      expect(() => dmTargetContract.parse({})).toThrow(/Required/u);
    });
  });
});
