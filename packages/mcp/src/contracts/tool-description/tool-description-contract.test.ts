import { toolDescriptionContract as _toolDescriptionContract } from './tool-description-contract';
import { ToolDescriptionStub } from './tool-description.stub';

describe('toolDescriptionContract', () => {
  it('VALID: {value: "Discover utilities"} => parses successfully', () => {
    const result = ToolDescriptionStub({ value: 'Discover utilities' });

    expect(result).toBe('Discover utilities');
  });

  it('VALID: {value: "Search for patterns"} => parses successfully', () => {
    const result = ToolDescriptionStub({ value: 'Search for patterns' });

    expect(result).toBe('Search for patterns');
  });

  it('VALID: {value: ""} => parses successfully', () => {
    const result = ToolDescriptionStub({ value: '' });

    expect(result).toBe('');
  });
});
