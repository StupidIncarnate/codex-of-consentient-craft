/**
 * PURPOSE: The @testing-library/user-event options every proxy in this package drives its
 * interactions through. `delay: null` is a measurement, not a preference: user-event's default
 * `delay: 0` awaits a real macrotask after every pointer step and every keystroke, and in this
 * jest+jsdom worker that macrotask costs 4.9ms per click and 2.0ms per character. Measured on
 * comment-popover-widget.test.tsx by replaying the same interactions against the same attached
 * tree under each setting: 10 clicks 222ms vs 173ms, 19 characters 121ms vs 83ms. Every event
 * user-event dispatches is dispatched either way — only the wait between them goes — so no
 * assertion reads anything different.
 *
 * USAGE:
 * await userEvent.click(button, userEventStatics.options);
 * const user = userEvent.setup(userEventStatics.options);
 */

export const userEventStatics = {
  options: {
    delay: null,
  },
} as const;
