import { fileScopeEmptyStatics } from './file-scope-empty-statics';

describe('fileScopeEmptyStatics', () => {
  // FOUR THINGS IN THIS LINE ARE LOAD-BEARING, and pinning the whole string is what holds all four:
  // it denies being a green run in as many words, it names both git flags that reach it, it names
  // the empty file list that reaches it too, and it ends with the scoped invocation that replaces
  // it. The outcome it replaced — a `--staged` run with nothing unpushed sweeping the whole repo and
  // exiting 0 — is one an agent reads as a pass, and two reviewers on quest a7520e60 reported
  // exactly that as their round's verdict. A reworded line that dropped the refusal, or the recovery
  // a headless session has no one to ask for, would put them back there.
  it('VALID: exported value => is exactly the one empty-scope line and nothing else', () => {
    expect(fileScopeEmptyStatics).toStrictEqual({
      message:
        'ward: the file scope resolved to 0 source files, so NO checks ran. Nothing is unpushed (--staged), nothing differs from the default branch (--changed), or the file list handed in was empty. This is an EMPTY run, not a green one. To check something, scope it yourself: npm run ward -- -- <files>',
    });
  });
});
