import { graphql } from 'graphql';
import { schema } from './schema';
import { userResolver } from './userResolver';

describe('V2Endpoint GraphQL Schema', () => {
  describe('Schema validation', () => {
    it('should validate User type structure', () => {
      const userType = schema.getType('User');
      expect(userType).toBeDefined();
      
      if (userType && 'getFields' in userType) {
        const fields = userType.getFields();
        expect(fields).toHaveProperty('id');
        expect(fields).toHaveProperty('name');
        expect(fields).toHaveProperty('email');
        expect(fields).toHaveProperty('createdAt');
      }
    });

    it('should validate Query type structure', () => {
      const queryType = schema.getType('Query');
      expect(queryType).toBeDefined();
      
      if (queryType && 'getFields' in queryType) {
        const fields = queryType.getFields();
        expect(fields).toHaveProperty('user');
        expect(fields).toHaveProperty('users');
      }
    });

    it('should execute user query successfully', async () => {
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
            createdAt
          }
        }
      `;

      const result = await graphql({
        schema,
        source: query,
        rootValue: userResolver,
        variableValues: { id: '1' }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.id).toBe('1');
      expect(result.data?.user.name).toBe('John Doe');
    });

    it('should execute users query successfully', async () => {
      const query = `
        query GetUsers($limit: Int, $offset: Int) {
          users(limit: $limit, offset: $offset) {
            id
            name
            email
            createdAt
          }
        }
      `;

      const result = await graphql({
        schema,
        source: query,
        rootValue: userResolver,
        variableValues: { limit: 2, offset: 0 }
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.users).toBeDefined();
      expect(Array.isArray(result.data?.users)).toBe(true);
      expect(result.data?.users).toHaveLength(2);
    });

    it('should handle invalid queries with proper error messages', async () => {
      const query = `
        query GetUser {
          user {
            id
            name
          }
        }
      `;

      const result = await graphql({
        schema,
        source: query,
        rootValue: userResolver
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('id');
    });

    it('should validate required fields', async () => {
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
            createdAt
          }
        }
      `;

      const result = await graphql({
        schema,
        source: query,
        rootValue: userResolver,
        variableValues: { id: '' }
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toBe('User ID is required');
    });

    // Performance testing for schema validation
    it('should validate schema quickly', () => {
      const start = Date.now();
      const userType = schema.getType('User');
      const queryType = schema.getType('Query');
      const duration = Date.now() - start;

      expect(userType).toBeDefined();
      expect(queryType).toBeDefined();
      expect(duration).toBeLessThan(50); // Schema validation should be very fast
    });
  });
});