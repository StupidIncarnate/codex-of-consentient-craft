// Example 4: Cryptographic Functions - Node.js crypto and Date Mocking
// This demonstrates mocking global objects using jest.spyOn()
// Common for generating predictable IDs and timestamps in tests

import {userCreateBroker} from './user-create-broker';
import {UserCreateDataStub} from '../../../contracts/user-create-data/user-create-data.stub';
import {UserStub} from '../../../contracts/user/user.stub';
import {userIdContract} from '../../../contracts/user-id/user-id-contract';

// Mock the database adapter that the broker uses
jest.mock('../../../adapters/database/db-create-user-adapter');
import {dbCreateUserAdapter} from '../../../adapters/database/db-create-user-adapter';
const mockDbCreateUserAdapter = jest.mocked(dbCreateUserAdapter);

describe('userCreateBroker', () => {
  beforeEach(() => {
    // Mock global crypto.randomUUID for predictable IDs
    // Use jest.spyOn() for global objects (NOT jest.mock())
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');

    // Mock global Date.now for predictable timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1609459200000);

    // Note: No manual mock cleanup needed - @questmaestro/testing handles it
  });

  it('VALID: {name: "John", email: "john@test.com"} => creates user with generated ID', async () => {
    // Arrange: Setup input data
    const userData = UserCreateDataStub({
      name: 'John',
      email: 'john@test.com'
    });

    // Expected result uses the mocked crypto.randomUUID and Date.now
    const expectedUser = UserStub({
      id: userIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
      name: 'John',
      email: 'john@test.com',
      createdAt: 1609459200000
    });

    // Mock the database adapter to return our expected user
    mockDbCreateUserAdapter.mockResolvedValue(expectedUser);

    // Act: Call the broker
    const result = await userCreateBroker({userData});

    // Assert: Verify the complete result
    expect(result).toStrictEqual(expectedUser);

    // Verify globals were called
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(Date.now).toHaveBeenCalledTimes(1);

    // Verify adapter was called with the generated ID and timestamp
    expect(mockDbCreateUserAdapter).toHaveBeenCalledTimes(1);
    expect(mockDbCreateUserAdapter).toHaveBeenCalledWith({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'John',
      email: 'john@test.com',
      createdAt: 1609459200000
    });
  });

  it('VALID: {name: "Jane", email: "jane@test.com"} => creates different user with same mocked ID', async () => {
    // Demonstrates that each test gets fresh mock state
    const userData = UserCreateDataStub({
      name: 'Jane',
      email: 'jane@test.com'
    });

    const expectedUser = UserStub({
      id: userIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
      name: 'Jane',
      email: 'jane@test.com',
      createdAt: 1609459200000
    });

    mockDbCreateUserAdapter.mockResolvedValue(expectedUser);

    const result = await userCreateBroker({userData});

    expect(result).toStrictEqual(expectedUser);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(Date.now).toHaveBeenCalledTimes(1);
  });

  it('ERROR: {email: "duplicate@test.com"} => throws duplicate email error', async () => {
    const userData = UserCreateDataStub({
      name: 'Test',
      email: 'duplicate@test.com'
    });

    // Mock database constraint violation
    mockDbCreateUserAdapter.mockRejectedValue(
      new Error('Email already exists')
    );

    await expect(userCreateBroker({userData})).rejects.toThrow('Email already exists');

    // Verify globals were still called before error
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(Date.now).toHaveBeenCalledTimes(1);
    expect(mockDbCreateUserAdapter).toHaveBeenCalledTimes(1);
  });

  it('EDGE: multiple calls in one test => each gets same mocked values', async () => {
    // Demonstrates that mocked values are consistent within a test
    // unless you use mockReturnValueOnce()

    const userData1 = UserCreateDataStub({
      name: 'User1',
      email: 'user1@test.com'
    });

    const userData2 = UserCreateDataStub({
      name: 'User2',
      email: 'user2@test.com'
    });

    const expectedUser1 = UserStub({
      id: userIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
      name: 'User1',
      email: 'user1@test.com',
      createdAt: 1609459200000
    });

    const expectedUser2 = UserStub({
      id: userIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479'),
      name: 'User2',
      email: 'user2@test.com',
      createdAt: 1609459200000
    });

    mockDbCreateUserAdapter
      .mockResolvedValueOnce(expectedUser1)
      .mockResolvedValueOnce(expectedUser2);

    const result1 = await userCreateBroker({userData: userData1});
    const result2 = await userCreateBroker({userData: userData2});

    expect(result1).toStrictEqual(expectedUser1);
    expect(result2).toStrictEqual(expectedUser2);

    // Both calls got the same ID and timestamp
    expect(crypto.randomUUID).toHaveBeenCalledTimes(2);
    expect(Date.now).toHaveBeenCalledTimes(2);
  });
});
