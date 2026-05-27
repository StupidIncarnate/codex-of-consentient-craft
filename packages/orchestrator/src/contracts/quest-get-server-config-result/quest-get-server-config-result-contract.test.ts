import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { questGetServerConfigResultContract } from './quest-get-server-config-result-contract';
import { QuestGetServerConfigResultStub } from './quest-get-server-config-result.stub';

describe('questGetServerConfigResultContract', () => {
  describe('valid results', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = QuestGetServerConfigResultStub();

      expect(result).toStrictEqual({
        baseUrl: 'http://dungeonmaster.localhost:3737',
        port: 3737,
      });
    });

    it('VALID: {custom baseUrl + port} => parses successfully', () => {
      const result = questGetServerConfigResultContract.parse({
        baseUrl: 'http://127.0.0.1:4750',
        port: NetworkPortStub({ value: 4750 }),
      });

      expect(result).toStrictEqual({
        baseUrl: 'http://127.0.0.1:4750',
        port: 4750,
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {baseUrl: "not a url"} => throws URL validation error', () => {
      expect(() =>
        questGetServerConfigResultContract.parse({
          baseUrl: 'not a url',
          port: NetworkPortStub({ value: 3737 }),
        }),
      ).toThrow(/url/iu);
    });

    it('INVALID: {port: 0} => throws min error', () => {
      expect(() =>
        questGetServerConfigResultContract.parse({
          baseUrl: 'http://localhost:3737',
          port: 0,
        }),
      ).toThrow(/greater than or equal to 1/u);
    });

    it('INVALID: {missing baseUrl} => throws Required', () => {
      expect(() =>
        questGetServerConfigResultContract.parse({
          port: NetworkPortStub({ value: 3737 }),
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing port} => throws Required', () => {
      expect(() =>
        questGetServerConfigResultContract.parse({
          baseUrl: 'http://localhost:3737',
        }),
      ).toThrow(/Required/u);
    });
  });
});
