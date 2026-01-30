/**
 * PURPOSE: Captures and provides assertion utilities for terminal screen frames
 *
 * USAGE:
 * const screen = createScreenCapture(terminalFrame);
 * expect(screen.contains('Welcome')).toBe(true);
 * expect(screen.notContains('Error')).toBe(true);
 * expect(screen.matches(/quest.*created/i)).toBe(true);
 * expect(screen.isScreen('menu')).toBe(true);
 *
 * Provides:
 * - ANSI code stripping for clean assertions
 * - Text content checking with contains/notContains
 * - Regex pattern matching
 * - Screen type detection
 */

/**
 * Screen type identifiers based on screen content patterns
 */
export type ScreenType = 'menu' | 'add' | 'list' | 'run' | 'help' | 'answer' | 'init' | 'unknown';

/**
 * Screen capture with assertion utilities
 */
export interface ScreenCapture {
  /** Raw terminal frame with ANSI codes */
  readonly raw: string;
  /** Clean text content with ANSI codes stripped */
  readonly text: string;
  /** Individual lines of clean text */
  readonly lines: readonly string[];
  /** Check if screen contains the specified text (case-insensitive by default) */
  contains: (text: string, options?: { caseSensitive?: boolean }) => boolean;
  /** Check if screen does NOT contain the specified text */
  notContains: (text: string, options?: { caseSensitive?: boolean }) => boolean;
  /** Check if screen content matches the regex pattern */
  matches: (pattern: RegExp) => boolean;
  /** Check if this appears to be a specific screen type based on content */
  isScreen: (screenType: ScreenType) => boolean;
  /** Get the detected screen type */
  getScreenType: () => ScreenType;
  /** Check if screen has any content */
  isEmpty: () => boolean;
  /** Get specific line by index (0-based) */
  getLine: (index: number) => string | undefined;
  /** Find line(s) containing specific text */
  findLines: (text: string) => string[];
  /** Debug: print screen content to console */
  debug: () => void;
}

/**
 * Strips ANSI escape codes from a string
 * Handles common ANSI sequences: colors, cursor movement, clearing
 */
export const stripAnsiCodes = (input: string): string => {
  // Regex pattern for common ANSI escape sequences:
  // - \x1B\[[0-9;]*[A-Za-z] - CSI sequences (colors, cursor, etc.)
  // - \x1B\][0-9]*;[^\x07]*\x07 - OSC sequences (title, etc.)
  // - \x1B[()][A-Z0-9] - Character set selection
  // eslint-disable-next-line no-control-regex
  const ansiPattern = /\x1B(?:\[[0-9;]*[A-Za-z]|\][0-9]*;[^\x07]*\x07|[()][A-Z0-9])/g;
  return input.replace(ansiPattern, '');
};

/**
 * Screen content patterns for detection
 */
const SCREEN_PATTERNS: Record<ScreenType, RegExp[]> = {
  menu: [/add.*run.*list/i, /welcome to.*dungeonmaster/i, /select.*option/i],
  add: [/what would you like to build/i, /describe.*feature/i, /enter.*quest/i],
  list: [/quests/i, /available.*quests/i, /quest.*list/i],
  run: [/running.*quest/i, /executing/i, /quest.*progress/i],
  help: [/help/i, /usage/i, /commands/i],
  answer: [/answer.*question/i, /provide.*response/i, /waiting.*input/i],
  init: [/initializing/i, /setup/i, /configure/i],
  unknown: [],
};

/**
 * Creates a screen capture instance from a terminal frame
 */
export const createScreenCapture = (frame: string): ScreenCapture => {
  // Extract only the last rendered screen by finding the last clear screen command
  // Clear screen command is: \x1b[2J\x1b[H (or similar variations)
  // This is important because the terminal buffer is cumulative - old content remains
  // unless explicitly cleared with ANSI codes
  const clearScreenPattern = /\x1b\[2J\x1b\[H/g;
  const clearMatches = Array.from(frame.matchAll(clearScreenPattern));

  let lastClearedPos = 0;
  if (clearMatches.length > 0) {
    // Get position after the last clear screen command
    const lastMatch = clearMatches[clearMatches.length - 1];
    if (lastMatch?.index !== undefined) {
      lastClearedPos = lastMatch.index + lastMatch[0].length;
    }
  }

  // Use only the content after the last clear screen
  const raw = frame.substring(lastClearedPos);
  const text = stripAnsiCodes(raw);
  const lines = Object.freeze(text.split('\n').map((line) => line.trimEnd()));

  const contains = (searchText: string, options?: { caseSensitive?: boolean }): boolean => {
    if (options?.caseSensitive === true) {
      return text.includes(searchText);
    }
    return text.toLowerCase().includes(searchText.toLowerCase());
  };

  const notContains = (searchText: string, options?: { caseSensitive?: boolean }): boolean =>
    !contains(searchText, options);

  const matches = (pattern: RegExp): boolean => pattern.test(text);

  const getScreenType = (): ScreenType => {
    for (const [screenType, patterns] of Object.entries(SCREEN_PATTERNS)) {
      if (screenType === 'unknown') continue;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return screenType as ScreenType;
        }
      }
    }
    return 'unknown';
  };

  const isScreen = (screenType: ScreenType): boolean => getScreenType() === screenType;

  const isEmpty = (): boolean => text.trim().length === 0;

  const getLine = (index: number): string | undefined => lines[index];

  const findLines = (searchText: string): string[] =>
    lines.filter((line) => line.toLowerCase().includes(searchText.toLowerCase()));

  const debug = (): void => {
    // eslint-disable-next-line no-console
    console.log('=== Screen Capture Debug ===');
    // eslint-disable-next-line no-console
    console.log('Raw length:', raw.length);
    // eslint-disable-next-line no-console
    console.log('Clean text length:', text.length);
    // eslint-disable-next-line no-console
    console.log('Lines:', lines.length);
    // eslint-disable-next-line no-console
    console.log('Detected screen type:', getScreenType());
    // eslint-disable-next-line no-console
    console.log('--- Content ---');
    // eslint-disable-next-line no-console
    console.log(text);
    // eslint-disable-next-line no-console
    console.log('=== End Debug ===');
  };

  return {
    raw,
    text,
    lines,
    contains,
    notContains,
    matches,
    isScreen,
    getScreenType,
    isEmpty,
    getLine,
    findLines,
    debug,
  };
};

/**
 * Utility to create empty screen capture for error states
 */
export const createEmptyScreenCapture = (): ScreenCapture => createScreenCapture('');
