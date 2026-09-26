import { stdout, stderr, argv, pid, platform, execPath } from './index';

describe('@dungeonmaster/node/process', () => {
  it('VALID: {stdout, stderr} => are the same Writable objects Node provides', () => {
    expect(stdout).toBe(process.stdout);
    expect(stderr).toBe(process.stderr);
  });

  it('VALID: {argv} => is the same array Node provides', () => {
    expect(argv).toBe(process.argv);
  });

  it('VALID: {pid} => is the same value process.pid holds', () => {
    expect(pid).toBe(process.pid);
  });

  it('VALID: {platform, execPath} => are the same values Node provides', () => {
    expect(platform).toBe(process.platform);
    expect(execPath).toBe(process.execPath);
  });
});
