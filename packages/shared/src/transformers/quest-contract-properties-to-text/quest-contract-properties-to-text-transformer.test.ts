import { questContractPropertiesToTextTransformer } from './quest-contract-properties-to-text-transformer';

describe('questContractPropertiesToTextTransformer', () => {
  describe('basic properties', () => {
    it('VALID: {properties: single with type, depth: 1} => returns indented line with type and description', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          {
            name: 'email' as never,
            type: 'EmailAddress' as never,
            description: 'User email' as never,
          },
        ],
        depth: 1,
      });

      expect(result).toStrictEqual(['  email: EmailAddress \u2014 User email']);
    });

    it('VALID: {properties: with value, depth: 1} => includes type, value, and description', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          {
            name: 'method' as never,
            type: 'HttpMethod' as never,
            value: 'POST' as never,
            description: 'HTTP method' as never,
          },
        ],
        depth: 1,
      });

      expect(result).toStrictEqual(['  method: HttpMethod = "POST" \u2014 HTTP method']);
    });

    it('VALID: {properties: with optional flag, depth: 1} => appends (optional) then description', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          {
            name: 'bio' as never,
            type: 'BioText' as never,
            description: 'User bio' as never,
            optional: true,
          },
        ],
        depth: 1,
      });

      expect(result).toStrictEqual(['  bio: BioText (optional) \u2014 User bio']);
    });

    it('VALID: {properties: with description, depth: 1} => appends em-dash description', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          { name: 'age' as never, type: 'Age' as never, description: 'User age' as never },
        ],
        depth: 1,
      });

      expect(result).toStrictEqual(['  age: Age \u2014 User age']);
    });
  });

  describe('depth', () => {
    it('VALID: {depth: 0} => no indentation', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          { name: 'id' as never, type: 'UserId' as never, description: 'User ID' as never },
        ],
        depth: 0,
      });

      expect(result).toStrictEqual(['id: UserId \u2014 User ID']);
    });

    it('VALID: {depth: 2} => double indentation', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          { name: 'id' as never, type: 'UserId' as never, description: 'User ID' as never },
        ],
        depth: 2,
      });

      expect(result).toStrictEqual(['    id: UserId \u2014 User ID']);
    });
  });

  describe('nested properties', () => {
    it('VALID: {properties: with nested children} => renders children at depth+1', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          {
            name: 'body' as never,
            type: 'RequestBody' as never,
            description: 'Request body' as never,
            properties: [
              {
                name: 'email' as never,
                type: 'EmailAddress' as never,
                description: 'User email' as never,
              },
              {
                name: 'password' as never,
                type: 'Password' as never,
                description: 'User password' as never,
              },
            ],
          },
        ],
        depth: 1,
      });

      expect(result).toStrictEqual([
        '  body: RequestBody \u2014 Request body',
        '    email: EmailAddress \u2014 User email',
        '    password: Password \u2014 User password',
      ]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {properties: []} => returns empty array', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [],
        depth: 1,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('multiple properties', () => {
    it('VALID: {properties: multiple} => returns one line per property', () => {
      const result = questContractPropertiesToTextTransformer({
        properties: [
          {
            name: 'email' as never,
            type: 'EmailAddress' as never,
            description: 'User email' as never,
          },
          { name: 'name' as never, type: 'UserName' as never, description: 'User name' as never },
        ],
        depth: 1,
      });

      expect(result).toStrictEqual([
        '  email: EmailAddress \u2014 User email',
        '  name: UserName \u2014 User name',
      ]);
    });
  });
});
