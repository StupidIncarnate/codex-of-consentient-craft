import { specNameContract } from './spec-name-contract';
import { SpecNameStub } from './spec-name.stub';

describe('specNameContract', () => {
  it('VALID: {value: "dungeonmaster-web"} => parses successfully', () => {
    const specName = SpecNameStub({ value: 'dungeonmaster-web' });

    const result = specNameContract.parse(specName);

    expect(result).toBe('dungeonmaster-web');
  });

  it('VALID: {value: "dungeonmaster-headless"} => a browserless spec name parses as a first-class name', () => {
    const specName = SpecNameStub({ value: 'dungeonmaster-headless' });

    const result = specNameContract.parse(specName);

    expect(result).toBe('dungeonmaster-headless');
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
