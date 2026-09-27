import { StatsFsStub } from './stats-fs.stub';

describe('StatsFsStub', () => {
  it('VALID: {} => defaults every field to 0', () => {
    const stats = StatsFsStub();

    expect(stats).toStrictEqual({
      type: 0,
      bsize: 0,
      blocks: 0,
      bfree: 0,
      bavail: 0,
      files: 0,
      ffree: 0,
      frsize: 0,
    });
  });

  it('VALID: {bavail, bsize} => carries them, leaving every other field at 0', () => {
    const stats = StatsFsStub({ bavail: 1000, bsize: 4096 });

    expect(stats).toStrictEqual({
      type: 0,
      bsize: 4096,
      blocks: 0,
      bfree: 0,
      bavail: 1000,
      files: 0,
      ffree: 0,
      frsize: 0,
    });
  });

  it('VALID: {frsize} => carries it, leaving every other field at 0', () => {
    const stats = StatsFsStub({ frsize: 512 });

    expect(stats).toStrictEqual({
      type: 0,
      bsize: 0,
      blocks: 0,
      bfree: 0,
      bavail: 0,
      files: 0,
      ffree: 0,
      frsize: 512,
    });
  });
});
