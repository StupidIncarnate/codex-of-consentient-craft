import { GlobMatchesStub } from './glob-matches.stub';

describe('GlobMatchesStub', () => {
  it("VALID: {} => the real absolute path to this subpath's own glob.ts", async () => {
    const paths = await GlobMatchesStub();

    expect(paths).toStrictEqual([`${__dirname}/glob.ts`]);
  });
});
