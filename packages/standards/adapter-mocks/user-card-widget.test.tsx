// Example 6: React Hook Mocking - Widget Testing with Binding
// This demonstrates mocking React hooks (bindings) from a component's perspective

import {render, screen, fireEvent} from '@testing-library/react';
import {UserCardWidget} from './user-card-widget';
import {UserIdStub} from '../../contracts/user-id/user-id.stub';
import {UserStub} from '../../contracts/user/user.stub';

// Mock the binding (React hook)
jest.mock('../../bindings/use-user-data/use-user-data-binding');
import {useUserDataBinding} from '../../bindings/use-user-data/use-user-data-binding';
const mockUseUserDataBinding = jest.mocked(useUserDataBinding);

// Mock the broker (called by event handlers)
jest.mock('../../brokers/user/update/user-update-broker');
import {userUpdateBroker} from '../../brokers/user/update/user-update-broker';
const mockUserUpdateBroker = jest.mocked(userUpdateBroker);

describe('UserCardWidget', () => {
  describe('render()', () => {
    it('VALID: {userId: "f47ac10b-..."} => renders user name and email', () => {
      // Arrange: Setup test data
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const user = UserStub({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      });

      // Mock the binding to return loaded state
      mockUseUserDataBinding.mockReturnValue({
        data: user,
        loading: false,
        error: null
      });

      // Act: Render the component
      render(<UserCardWidget userId={userId} />);

      // Assert: Verify UI elements
      expect(screen.getByTestId('user-name')).toHaveTextContent(/^John Doe$/);
      expect(screen.getByTestId('user-email')).toHaveTextContent(/^john@example\.com$/);

      // Verify binding was called with correct args
      expect(mockUseUserDataBinding).toHaveBeenCalledTimes(1);
      expect(mockUseUserDataBinding).toHaveBeenCalledWith({userId});
    });

    it('VALID: {userId: different} => renders different user', () => {
      const userId = UserIdStub('a1b2c3d4-58cc-4372-a567-0e02b2c3d479');
      const user = UserStub({
        id: userId,
        name: 'Jane Smith',
        email: 'jane@example.com'
      });

      mockUseUserDataBinding.mockReturnValue({
        data: user,
        loading: false,
        error: null
      });

      render(<UserCardWidget userId={userId} />);

      expect(screen.getByTestId('user-name')).toHaveTextContent(/^Jane Smith$/);
      expect(screen.getByTestId('user-email')).toHaveTextContent(/^jane@example\.com$/);
      expect(mockUseUserDataBinding).toHaveBeenCalledWith({userId});
    });

    it('VALID: {loading: true} => renders loading state', () => {
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');

      // Mock binding returning loading state
      mockUseUserDataBinding.mockReturnValue({
        data: null,
        loading: true,
        error: null
      });

      render(<UserCardWidget userId={userId} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
      expect(mockUseUserDataBinding).toHaveBeenCalledWith({userId});
    });

    it('ERROR: {error: Error} => renders error message', () => {
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const error = new Error('Failed to load user');

      // Mock binding returning error state
      mockUseUserDataBinding.mockReturnValue({
        data: null,
        loading: false,
        error
      });

      render(<UserCardWidget userId={userId} />);

      expect(screen.getByTestId('error-message')).toHaveTextContent(/^Failed to load user$/);
      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
      expect(mockUseUserDataBinding).toHaveBeenCalledWith({userId});
    });

    it('EMPTY: {data: null, loading: false, error: null} => renders no user found', () => {
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');

      // Mock binding returning empty state (no data, not loading, no error)
      mockUseUserDataBinding.mockReturnValue({
        data: null,
        loading: false,
        error: null
      });

      render(<UserCardWidget userId={userId} />);

      expect(screen.getByTestId('no-user-message')).toHaveTextContent(/^No user found$/);
      expect(mockUseUserDataBinding).toHaveBeenCalledWith({userId});
    });
  });

  describe('update button click', () => {
    it('VALID: click update button => calls userUpdateBroker and onUpdate callback', async () => {
      // Arrange
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const user = UserStub({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      });

      const onUpdate = jest.fn();

      // Mock binding to return user data
      mockUseUserDataBinding.mockReturnValue({
        data: user,
        loading: false,
        error: null
      });

      // Mock broker to succeed
      mockUserUpdateBroker.mockResolvedValue(user);

      render(<UserCardWidget userId={userId} onUpdate={onUpdate} />);

      // Act: Click the update button
      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);

      // Wait for async broker call
      await screen.findByTestId('user-name');

      // Assert: Verify broker was called (event handlers call brokers, NOT bindings)
      expect(mockUserUpdateBroker).toHaveBeenCalledTimes(1);
      expect(mockUserUpdateBroker).toHaveBeenCalledWith({
        userId,
        data: user
      });

      // Verify callback was called
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith({userId});
    });

    it('VALID: click update when loading => button is disabled', () => {
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');

      // Mock loading state
      mockUseUserDataBinding.mockReturnValue({
        data: null,
        loading: true,
        error: null
      });

      render(<UserCardWidget userId={userId} />);

      // Update button should not exist during loading
      expect(screen.queryByTestId('update-button')).not.toBeInTheDocument();
    });

    it('ERROR: broker fails => does not call onUpdate callback', async () => {
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const user = UserStub({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      });

      const onUpdate = jest.fn();

      mockUseUserDataBinding.mockReturnValue({
        data: user,
        loading: false,
        error: null
      });

      // Mock broker to fail
      mockUserUpdateBroker.mockRejectedValue(new Error('Update failed'));

      render(<UserCardWidget userId={userId} onUpdate={onUpdate} />);

      const updateButton = screen.getByTestId('update-button');
      fireEvent.click(updateButton);

      // Wait for error to be handled
      await new Promise(resolve => setTimeout(resolve, 0));

      // Assert: Broker was called but callback was not (due to error)
      expect(mockUserUpdateBroker).toHaveBeenCalledTimes(1);
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('optional props', () => {
    it('VALID: {onUpdate: undefined} => renders without callback', () => {
      const userId = UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const user = UserStub({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      });

      mockUseUserDataBinding.mockReturnValue({
        data: user,
        loading: false,
        error: null
      });

      // Render without onUpdate prop
      render(<UserCardWidget userId={userId} />);

      expect(screen.getByTestId('user-name')).toHaveTextContent(/^John Doe$/);
      expect(mockUseUserDataBinding).toHaveBeenCalledWith({userId});
    });
  });
});
