/**
 * PURPOSE: Proxy for ink useInput adapter - no-op since real ink is used
 *
 * USAGE:
 * inkUseInputAdapterProxy(); // Sets up nothing - real useInput hook is used
 *
 * For key simulation, use stdin.write() from ink-testing-library:
 * const { stdin } = render(<Widget />);
 * stdin.write('\x1B[B'); // Down arrow
 * stdin.write('\r');     // Enter
 * stdin.write('q');      // 'q' key
 */

// Real ink hooks are used for testing via ink-testing-library
// No mocking needed - this proxy exists for API compatibility
// Use stdin.write() to simulate keyboard input
export const inkUseInputAdapterProxy = (): Record<PropertyKey, never> => ({});
