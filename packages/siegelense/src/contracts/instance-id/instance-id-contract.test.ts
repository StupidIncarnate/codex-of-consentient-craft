import { instanceIdContract } from './instance-id-contract';
import { InstanceIdStub } from './instance-id.stub';

describe('instanceIdContract', () => {
  it('VALID: {value: "inst_7f3a9c21"} => parses and returns branded InstanceId', () => {
    const result = InstanceIdStub({ value: 'inst_7f3a9c21' });

    expect(result).toBe('inst_7f3a9c21');
  });

  it('INVALID: {value: "run_7f3a9c21"} => throws for the wrong prefix', () => {
    expect(() => instanceIdContract.parse('run_7f3a9c21')).toThrow(/invalid_format/u);
  });

  it('INVALID: {value: "inst_7F3A"} => throws for uppercase hex', () => {
    expect(() => instanceIdContract.parse('inst_7F3A')).toThrow(/invalid_format/u);
  });

  it('INVALID: {value: "inst_abc"} => throws for fewer than 4 hex characters', () => {
    expect(() => instanceIdContract.parse('inst_abc')).toThrow(/invalid_format/u);
  });

  it('EDGE: {value: "inst_abcd"} => parses at the 4-character hex minimum', () => {
    const result = InstanceIdStub({ value: 'inst_abcd' });

    expect(result).toBe('inst_abcd');
  });

  it('INVALID: {value: "inst_bogus1234"} => the rendered ZodError names the instance id format', async () => {
    const thrownError = await Promise.resolve()
      .then(() => instanceIdContract.parse('inst_bogus1234'))
      .catch((error: unknown) => error);

    expect(String(thrownError)).toBe(
      '[\n' +
        '  {\n' +
        '    "origin": "string",\n' +
        '    "code": "invalid_format",\n' +
        '    "format": "regex",\n' +
        '    "pattern": "/^inst_[0-9a-f]{4,}$/u",\n' +
        '    "path": [],\n' +
        '    "message": "Instance id must look like \\"inst_\\" followed by 4 or more lowercase hex characters, e.g. \\"inst_7f3a9c21\\""\n' +
        '  }\n' +
        ']',
    );
  });
});
