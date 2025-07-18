import { GraphQLResolveInfo } from 'graphql';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserQueryArgs {
  id: string;
}

export interface UsersQueryArgs {
  limit?: number;
  offset?: number;
}

// Mock data store - in real implementation this would connect to a database
const users: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    createdAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    createdAt: '2024-01-03T00:00:00Z'
  }
];

export const userResolver = {
  Query: {
    user: async (
      parent: any,
      args: UserQueryArgs,
      context: any,
      info: GraphQLResolveInfo
    ): Promise<User | null> => {
      // Input validation
      if (!args.id) {
        throw new Error('User ID is required');
      }

      // Find user by ID
      const user = users.find(u => u.id === args.id);
      return user || null;
    },

    users: async (
      parent: any,
      args: UsersQueryArgs,
      context: any,
      info: GraphQLResolveInfo
    ): Promise<User[]> => {
      // Apply pagination
      const limit = args.limit || 10;
      const offset = args.offset || 0;

      // Input validation
      if (limit < 1 || limit > 100) {
        throw new Error('Limit must be between 1 and 100');
      }
      if (offset < 0) {
        throw new Error('Offset must be non-negative');
      }

      return users.slice(offset, offset + limit);
    }
  }
};