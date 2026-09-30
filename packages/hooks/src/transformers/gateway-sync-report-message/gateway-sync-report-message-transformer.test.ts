import { gatewaySyncReportMessageTransformer } from './gateway-sync-report-message-transformer';

describe('gatewaySyncReportMessageTransformer', () => {
  it('VALID: {exitCode: 0, output} => returns the trimmed output under a success line', () => {
    const result = gatewaySyncReportMessageTransformer({
      exitCode: 0,
      output: '  generated: left-pad\ncopied: zod\n\n',
      timedOut: false,
    });

    expect(result).toBe(
      'dungeonmaster gateway-sync ran after this npm install:\ngenerated: left-pad\ncopied: zod',
    );
  });

  it('EMPTY: {exitCode: 0, output: ""} => returns success line with "(no output)"', () => {
    const result = gatewaySyncReportMessageTransformer({
      exitCode: 0,
      output: '',
      timedOut: false,
    });

    expect(result).toBe('dungeonmaster gateway-sync ran after this npm install:\n(no output)');
  });

  it('ERROR: {exitCode: 3, output} => returns the exit code, the re-run command and the output', () => {
    const result = gatewaySyncReportMessageTransformer({
      exitCode: 3,
      output: 'EACCES: permission denied\n',
      timedOut: false,
    });

    expect(result).toBe(
      'dungeonmaster gateway-sync exited 3 after this npm install, so packages/@gateway/npm/src may lack a folder for the new package. Fix the cause and run `dungeonmaster gateway-sync` again. Output:\nEACCES: permission denied',
    );
  });

  it('ERROR: {timedOut: true} => returns the stopped message with the output so far', () => {
    const result = gatewaySyncReportMessageTransformer({
      exitCode: 1,
      output: 'copied: zod\n',
      timedOut: true,
    });

    expect(result).toBe(
      'dungeonmaster gateway-sync was stopped before it finished after this npm install. Run `dungeonmaster gateway-sync` yourself so packages/@gateway/npm/src gets a folder for the new package. Output so far:\ncopied: zod',
    );
  });
});
