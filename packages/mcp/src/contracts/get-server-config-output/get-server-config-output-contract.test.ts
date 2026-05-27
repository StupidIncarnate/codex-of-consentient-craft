import { NetworkPortStub } from '@dungeonmaster/shared/contracts';

import { getServerConfigOutputContract } from './get-server-config-output-contract';
import { GetServerConfigOutputStub } from './get-server-config-output.stub';

describe('getServerConfigOutputContract', () => {
  it('VALID: {baseUrl, port} default stub => parses successfully', () => {
    const result = getServerConfigOutputContract.parse(GetServerConfigOutputStub());

    expect(result).toStrictEqual({
      baseUrl: 'http://localhost:3737',
      port: 3737,
    });
  });

  it('VALID: {custom baseUrl + port} => parses successfully', () => {
    const port = NetworkPortStub({ value: 4242 });

    const result = getServerConfigOutputContract.parse({
      baseUrl: 'http://127.0.0.1:4242',
      port,
    });

    expect(result).toStrictEqual({
      baseUrl: 'http://127.0.0.1:4242',
      port,
    });
  });

  it('INVALID: {baseUrl: "not a url"} => throws URL validation error', () => {
    expect(() =>
      getServerConfigOutputContract.parse({
        baseUrl: 'not a url',
        port: NetworkPortStub({ value: 3737 }),
      }),
    ).toThrow(/Invalid url/u);
  });

  it('INVALID: {port: 0} => throws min error', () => {
    expect(() =>
      getServerConfigOutputContract.parse({
        baseUrl: 'http://localhost:3737',
        port: 0,
      }),
    ).toThrow(/too_small|Number must be greater/u);
  });

  it('INVALID: {missing baseUrl} => throws Required', () => {
    expect(() =>
      getServerConfigOutputContract.parse({ port: NetworkPortStub({ value: 3737 }) }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing port} => throws Required', () => {
    expect(() => getServerConfigOutputContract.parse({ baseUrl: 'http://localhost:3737' })).toThrow(
      /Required/u,
    );
  });

  it('INVALID: {unknown key} => throws Unrecognized key error', () => {
    expect(() =>
      getServerConfigOutputContract.parse({
        baseUrl: 'http://localhost:3737',
        port: NetworkPortStub({ value: 3737 }),
        extra: 'no',
      } as never),
    ).toThrow(/Unrecognized key/u);
  });
});
