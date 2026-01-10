/**
 * PURPOSE: Wraps React's useState hook for mockability in tests
 *
 * USAGE:
 * const [value, setValue] = reactUseStateAdapter({initialValue: 'initial'});
 * // Returns tuple of [state, setState] just like React.useState
 */
import type React from 'react';
import { useState } from 'react';

export const reactUseStateAdapter = <T>({
  initialValue,
}: {
  initialValue: T | (() => T);
}): [T, React.Dispatch<React.SetStateAction<T>>] => useState<T>(initialValue);
