import { errorSchema } from './Error';
import { errorSchema as directSchema } from './error-schema';

describe('#gateway/browser/Error', () => {
  it('VALID: {export} => is the same schema the schema file provides', () => {
    expect(errorSchema).toBe(directSchema);
  });
});
