import { ContentTypeStub } from './content-type.stub';

describe('contentTypeContract', () => {
  it('VALID: {value: "text"} => parses successfully', () => {
    const result = ContentTypeStub({ value: 'text' });

    expect(result).toBe('text');
  });

  it('VALID: {value: "application/json"} => parses successfully', () => {
    const result = ContentTypeStub({ value: 'application/json' });

    expect(result).toBe('application/json');
  });

  it('VALID: {value: "image/png"} => parses successfully', () => {
    const result = ContentTypeStub({ value: 'image/png' });

    expect(result).toBe('image/png');
  });
});
