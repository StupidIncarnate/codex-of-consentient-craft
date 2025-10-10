// Example 3: Database Call - Database Client (Prisma/Postgres) Mocking
// This demonstrates mocking database clients and ORM queries

import { dbFetchUserAdapter } from './db-fetch-user-adapter';
import { UserIdStub } from '../../contracts/user-id/user-id.stub';
import { UserStub } from '../../contracts/user/user.stub';
import { userIdContract } from '../../contracts/user-id/user-id-contract';

// Mock the database client state
// In this architecture, the db client lives in state/ as a singleton
jest.mock('../../state/db-client/db-client-state');
import { dbClientState } from '../../state/db-client/db-client-state';
const mockDbClient = jest.mocked(dbClientState);

describe('dbFetchUserAdapter', () => {
  it('VALID: {userId: "f47ac10b-..."} => returns user from database', async () => {
    // Arrange: Setup test data with proper UUIDs
    const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    const expectedUser = UserStub({
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    });

    // Mock database query result
    // Note: DB returns raw data, adapter translates to branded types
    mockDbClient.users.findUnique.mockResolvedValue({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'John Doe',
      email: 'john@example.com',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    });

    // Act
    const result = await dbFetchUserAdapter({ userId });

    // Assert: Test complete object
    expect(result).toStrictEqual(expectedUser);
    expect(mockDbClient.users.findUnique).toHaveBeenCalledTimes(1);
    expect(mockDbClient.users.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('VALID: {userId: "a1b2c3d4-..."} => returns different user', async () => {
    const userId = UserIdStub('a1b2c3d4-58cc-4372-a567-0e02b2c3d479');
    const expectedUser = UserStub({
      id: userId,
      name: 'Jane Smith',
      email: 'jane@example.com',
    });

    mockDbClient.users.findUnique.mockResolvedValue({
      id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      name: 'Jane Smith',
      email: 'jane@example.com',
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-01'),
    });

    const result = await dbFetchUserAdapter({ userId });

    expect(result).toStrictEqual(expectedUser);
    expect(mockDbClient.users.findUnique).toHaveBeenCalledTimes(1);
  });

  it('EMPTY: {userId: "nonexistent-id"} => throws user not found error', async () => {
    const userId = UserIdStub('00000000-0000-0000-0000-000000000000');

    // Database returns null when record not found
    mockDbClient.users.findUnique.mockResolvedValue(null);

    await expect(dbFetchUserAdapter({ userId })).rejects.toThrow('User not found');
    expect(mockDbClient.users.findUnique).toHaveBeenCalledTimes(1);
    expect(mockDbClient.users.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('ERROR: {userId: valid} => throws database connection error', async () => {
    const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    // Mock database connection failure
    mockDbClient.users.findUnique.mockRejectedValue(new Error('Connection to database failed'));

    await expect(dbFetchUserAdapter({ userId })).rejects.toThrow('Connection to database failed');
    expect(mockDbClient.users.findUnique).toHaveBeenCalledTimes(1);
  });
});
