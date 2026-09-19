import { specNameContract } from './spec-name-contract';
import { SpecNameStub } from './spec-name.stub';

describe('specNameContract', () => {
  it('VALID: {value: "dungeonmaster-stack"} => parses successfully', () => {
    const specName = SpecNameStub({ value: 'dungeonmaster-stack' });

    const result = specNameContract.parse(specName);

    expect(result).toBe('dungeonmaster-stack');
  });

  it('VALID: {value: "dungeonmaster-api"} => a browserless spec name parses as a first-class name', () => {
    const specName = SpecNameStub({ value: 'dungeonmaster-api' });

    const result = specNameContract.parse(specName);

    expect(result).toBe('dungeonmaster-api');
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      specNameContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('EDGE: {value: "a"} => a single-character name parses successfully', () => {
    const result = specNameContract.parse('a');

    expect(result).toBe('a');
  });
});
