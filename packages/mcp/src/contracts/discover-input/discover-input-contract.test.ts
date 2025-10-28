import { DiscoverInputStub } from './discover-input.stub';

describe('discoverInputContract', () => {
  it('VALID: {type: "files"} => parses successfully', () => {
    const result = DiscoverInputStub({ type: 'files' });

    expect(result).toStrictEqual({ type: 'files' });
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
});
