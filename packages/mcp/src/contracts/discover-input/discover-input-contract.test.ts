import { discoverInputContract as _discoverInputContract } from './discover-input-contract';
import { DiscoverInputStub } from './discover-input.stub';

describe('discoverInputContract', () => {
  it('VALID: {type: "files"} => parses successfully', () => {
    const result = DiscoverInputStub({ type: 'files' });

    expect(result).toStrictEqual({ type: 'files' });
  });

  it('VALID: {type: "standards"} => parses successfully', () => {
    const result = DiscoverInputStub({ type: 'standards' });

    expect(result).toStrictEqual({ type: 'standards' });
  });

  it('VALID: {type: "standards", section: "testing/proxy-architecture"} => parses successfully', () => {
    const result = DiscoverInputStub({
      type: 'standards',
      section: 'testing/proxy-architecture',
    });

    expect(result).toStrictEqual({
      type: 'standards',
      section: 'testing/proxy-architecture',
    });
  });

  it('VALID: {type: "files", path: "packages/eslint-plugin"} => parses successfully', () => {
    const result = DiscoverInputStub({
      type: 'files',
      path: 'packages/eslint-plugin',
    });

    expect(result).toStrictEqual({
      type: 'files',
      path: 'packages/eslint-plugin',
    });
  });

  it('VALID: {type: "files", fileType: "broker"} => parses successfully', () => {
    const result = DiscoverInputStub({
      type: 'files',
      fileType: 'broker',
    });

    expect(result).toStrictEqual({
      type: 'files',
      fileType: 'broker',
    });
  });

  it('VALID: {type: "files", search: "user fetch"} => parses successfully', () => {
    const result = DiscoverInputStub({
      type: 'files',
      search: 'user fetch',
    });

    expect(result).toStrictEqual({
      type: 'files',
      search: 'user fetch',
    });
  });

  it('VALID: {type: "files", name: "userFetchBroker"} => parses successfully', () => {
    const result = DiscoverInputStub({
      type: 'files',
      name: 'userFetchBroker',
    });

    expect(result).toStrictEqual({
      type: 'files',
      name: 'userFetchBroker',
    });
  });

  it('VALID: {type: "files", path: "packages/eslint-plugin", fileType: "broker"} => parses successfully', () => {
    const result = DiscoverInputStub({
      type: 'files',
      path: 'packages/eslint-plugin',
      fileType: 'broker',
    });

    expect(result).toStrictEqual({
      type: 'files',
      path: 'packages/eslint-plugin',
      fileType: 'broker',
    });
  });

  it('VALID: {type: "files", path: "src", fileType: "broker", search: "user", name: "userBroker"} => parses successfully', () => {
    const result = DiscoverInputStub({
      type: 'files',
      path: 'src',
      fileType: 'broker',
      search: 'user',
      name: 'userBroker',
    });

    expect(result).toStrictEqual({
      type: 'files',
      path: 'src',
      fileType: 'broker',
      search: 'user',
      name: 'userBroker',
    });
  });
});
