import { GraphQLResolveInfo } from 'graphql';
import { userResolver, User, UserQueryArgs, UsersQueryArgs } from './userResolver';

// Mock GraphQL info object
const mockInfo: GraphQLResolveInfo = {
  fieldName: 'user',
  fieldNodes: [],
  returnType: {} as any,
  parentType: {} as any,
  path: { key: 'user', typename: 'Query' },
  schema: {} as any,
  fragments: {},
  rootValue: {},
  operation: {} as any,
  variableValues: {}
};

describe('V2Endpoint User Resolver', () => {
  describe('Query.user', () => {
    it('should return a user by ID', async () => {
      const args: UserQueryArgs = { id: '1' };
      const result = await userResolver.Query.user(null, args, null, mockInfo);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.name).toBe('John Doe');
      expect(result?.email).toBe('john@example.com');
    });

    it('should return null for non-existent user', async () => {
      const args: UserQueryArgs = { id: '999' };
      const result = await userResolver.Query.user(null, args, null, mockInfo);
      
      expect(result).toBeNull();
    });

    it('should throw error for missing ID', async () => {
      const args: UserQueryArgs = { id: '' };
      
      await expect(
        userResolver.Query.user(null, args, null, mockInfo)
      ).rejects.toThrow('User ID is required');
    });

    it('should validate schema structure', () => {
      const args: UserQueryArgs = { id: '1' };
      return userResolver.Query.user(null, args, null, mockInfo).then(result => {
        if (result) {
          expect(result).toHaveProperty('id');
          expect(result).toHaveProperty('name');
          expect(result).toHaveProperty('email');
          expect(result).toHaveProperty('createdAt');
          expect(typeof result.id).toBe('string');
          expect(typeof result.name).toBe('string');
          expect(typeof result.email).toBe('string');
          expect(typeof result.createdAt).toBe('string');
        }
      });
    });
  });

  describe('Query.users', () => {
    it('should return all users with default pagination', async () => {
      const args: UsersQueryArgs = {};
      const result = await userResolver.Query.users(null, args, null, mockInfo);
      
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });

    it('should respect limit parameter', async () => {
      const args: UsersQueryArgs = { limit: 2 };
      const result = await userResolver.Query.users(null, args, null, mockInfo);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should respect offset parameter', async () => {
      const args: UsersQueryArgs = { offset: 1, limit: 2 };
      const result = await userResolver.Query.users(null, args, null, mockInfo);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
    });

    it('should validate limit range', async () => {
      const args: UsersQueryArgs = { limit: 101 };
      
      await expect(
        userResolver.Query.users(null, args, null, mockInfo)
      ).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should validate negative limit', async () => {
      const args: UsersQueryArgs = { limit: -1 };
      
      await expect(
        userResolver.Query.users(null, args, null, mockInfo)
      ).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should validate negative offset', async () => {
      const args: UsersQueryArgs = { offset: -1 };
      
      await expect(
        userResolver.Query.users(null, args, null, mockInfo)
      ).rejects.toThrow('Offset must be non-negative');
    });

    it('should validate schema structure for multiple users', async () => {
      const args: UsersQueryArgs = { limit: 2 };
      const result = await userResolver.Query.users(null, args, null, mockInfo);
      
      expect(result).toHaveLength(2);
      result.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('createdAt');
        expect(typeof user.id).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.createdAt).toBe('string');
      });
    });

    // Performance testing as required by V2 standards
    it('should complete queries within acceptable time limits', async () => {
      const start = Date.now();
      const args: UsersQueryArgs = { limit: 10 };
      
      await userResolver.Query.users(null, args, null, mockInfo);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array(10).fill(0).map(() => 
        userResolver.Query.users(null, { limit: 5 }, null, mockInfo)
      );
      
      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(500); // All 10 concurrent requests should complete within 500ms
      results.forEach(result => {
        expect(result).toHaveLength(3); // All available users
      });
    });
  });
});