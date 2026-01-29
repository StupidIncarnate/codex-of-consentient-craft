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
});
