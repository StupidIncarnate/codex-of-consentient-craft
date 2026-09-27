import { ContentfulStatusCodeStub } from './contentful-status-code.stub';

describe('ContentfulStatusCodeStub', () => {
  it('VALID: {} => 200', () => {
    expect(ContentfulStatusCodeStub()).toBe(200);
  });
});
