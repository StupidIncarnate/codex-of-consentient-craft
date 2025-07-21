// Test to verify Jest setup file is preventing mock bleedthrough

describe('Jest Setup Verification', () => {
  // Mock function that we'll use across tests
  const mockFunction = jest.fn();

  describe('Mock Reset Verification', () => {
    it('first test - should call mock function', () => {
      // Call the mock function 3 times
      mockFunction('first call');
      mockFunction('second call');
      mockFunction('third call');

      // Verify it was called 3 times
      expect(mockFunction).toHaveBeenCalledTimes(3);
      expect(mockFunction).toHaveBeenCalledWith('first call');
      expect(mockFunction).toHaveBeenCalledWith('second call');
      expect(mockFunction).toHaveBeenCalledWith('third call');
    });

    it('second test - mock should be reset (no bleedthrough)', () => {
      // Without the setup file, this would fail because the mock
      // would still have the 3 calls from the previous test
      expect(mockFunction).toHaveBeenCalledTimes(0);
      expect(mockFunction).not.toHaveBeenCalled();

      // Now we can use it fresh
      mockFunction('fresh call');
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(mockFunction).toHaveBeenCalledWith('fresh call');
    });
  });

  describe('Timer Reset Verification', () => {
    it('first test - should use fake timers', () => {
      // Use fake timers
      jest.useFakeTimers();

      const callback = jest.fn();
      setTimeout(callback, 1000);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('second test - should have real timers restored', async () => {
      // Without the setup file, this test would hang because
      // fake timers would still be active
      const startTime = Date.now();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // With real timers, this should take at least 10ms
      expect(elapsed).toBeGreaterThanOrEqual(9); // Allow 1ms variance
      expect(elapsed).toBeLessThan(50); // But not too long
    });
  });

  describe('Module Mock Reset Verification', () => {
    // Mock a module
    const mockModule = {
      getData: jest.fn(),
      processData: jest.fn(),
    };

    it('first test - should set mock implementation', () => {
      mockModule.getData.mockReturnValue('mocked data');
      mockModule.processData.mockImplementation((data: string) => data.toUpperCase());

      expect(mockModule.getData()).toBe('mocked data');
      expect(mockModule.processData('hello')).toBe('HELLO');
      expect(mockModule.getData).toHaveBeenCalledTimes(1);
      expect(mockModule.processData).toHaveBeenCalledTimes(1);
    });

    it('second test - mocks should be reset', () => {
      // Without setup file, these would still have implementations
      expect(mockModule.getData()).toBeUndefined();
      expect(mockModule.processData('hello')).toBeUndefined();

      // And call counts should be reset
      expect(mockModule.getData).toHaveBeenCalledTimes(1);
      expect(mockModule.processData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Spy Restoration Verification', () => {
    const testObject = {
      method: () => 'original value',
    };

    it('first test - should spy on method', () => {
      const spy = jest.spyOn(testObject, 'method').mockReturnValue('mocked value');

      expect(testObject.method()).toBe('mocked value');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('second test - spy should be restored', () => {
      // Without setup file, this would still return 'mocked value'
      expect(testObject.method()).toBe('original value');
    });
  });
});
