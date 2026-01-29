import { detectCliScreenTransformer } from './detect-cli-screen-transformer';

describe('detectCliScreenTransformer', () => {
  it('VALID: {menu screen output without list keyword} => returns menu', () => {
    const result = detectCliScreenTransformer({
      frame: 'Add a quest\nRun a quest\nShow all',
    });

    expect(result).toBe('menu');
  });

  it('VALID: {add screen output without question mark} => returns add', () => {
    const result = detectCliScreenTransformer({
      frame: 'What would you like to build today',
    });

    expect(result).toBe('add');
  });

  it('VALID: {list screen output} => returns list', () => {
    const result = detectCliScreenTransformer({
      frame: '.dungeonmaster-quests/001-my-quest',
    });

    expect(result).toBe('list');
  });

  it('VALID: {answer screen with question} => returns answer', () => {
    const result = detectCliScreenTransformer({
      frame: 'Why hello world?',
    });

    expect(result).toBe('answer');
  });

  it('VALID: {help screen output} => returns help', () => {
    const result = detectCliScreenTransformer({
      frame: 'Help - Usage guide',
    });

    expect(result).toBe('help');
  });

  it('VALID: {unknown output} => returns menu as default', () => {
    const result = detectCliScreenTransformer({
      frame: 'random text without any markers',
    });

    expect(result).toBe('menu');
  });

  it('VALID: {answer takes priority over menu} => returns answer', () => {
    const result = detectCliScreenTransformer({
      frame: 'Add something? Run this?',
    });

    expect(result).toBe('answer');
  });

  it('VALID: {menu with "quests" text but no path} => returns menu not list', () => {
    const result = detectCliScreenTransformer({
      frame: 'Add a quest\nRun a quest\nList - List all active quests',
    });

    expect(result).toBe('menu');
  });

  it('VALID: {menu with Init option} => returns menu not init', () => {
    const result = detectCliScreenTransformer({
      frame: 'Add\nRun\nList\nInit - Initialize dungeonmaster in project',
    });

    expect(result).toBe('menu');
  });

  it('VALID: {actual init screen} => returns init', () => {
    const result = detectCliScreenTransformer({
      frame: 'Initializing dungeonmaster...',
    });

    expect(result).toBe('init');
  });

  it('VALID: {add screen with question mark} => returns add not answer', () => {
    const result = detectCliScreenTransformer({
      frame: 'What would you like to build?\n> _\nPress Enter to submit',
    });

    expect(result).toBe('add');
  });
});
