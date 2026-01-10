import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { inkTestRender as render } from '../../adapters/ink-testing-library/render/ink-test-render';

import { CliAppWidget } from './cli-app-widget';

describe('CliAppWidget', () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('screen routing', () => {
    it('VALID: {initialScreen: menu} => renders menu screen', () => {
      const { lastFrame, unmount } = render(
        <CliAppWidget initialScreen="menu" onSpawnChaoswhisperer={jest.fn()} onExit={jest.fn()} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/dungeonmaster/u);
      expect(lastFrame()).toMatch(/> Add/u);
    });

    it('VALID: {initialScreen: help} => renders help screen', () => {
      const { lastFrame, unmount } = render(
        <CliAppWidget initialScreen="help" onSpawnChaoswhisperer={jest.fn()} onExit={jest.fn()} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Available Commands/u);
    });

    it('VALID: {initialScreen: list} => renders list screen', () => {
      const { lastFrame, unmount } = render(
        <CliAppWidget initialScreen="list" onSpawnChaoswhisperer={jest.fn()} onExit={jest.fn()} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Active Quests/u);
    });

    it('VALID: {initialScreen: init} => renders init screen', () => {
      const { lastFrame, unmount } = render(
        <CliAppWidget initialScreen="init" onSpawnChaoswhisperer={jest.fn()} onExit={jest.fn()} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {initialScreen: add} => renders add screen with text input', () => {
      const { lastFrame, unmount } = render(
        <CliAppWidget initialScreen="add" onSpawnChaoswhisperer={jest.fn()} onExit={jest.fn()} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/What would you like to build/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onSpawnChaoswhisperer, onExit callbacks} => accepts callbacks', () => {
      const onSpawnChaoswhisperer = jest.fn();
      const onExit = jest.fn();

      const { unmount } = render(
        <CliAppWidget
          initialScreen="menu"
          onSpawnChaoswhisperer={onSpawnChaoswhisperer}
          onExit={onExit}
        />,
      );
      unmountFn = unmount;

      expect(onSpawnChaoswhisperer).toBeDefined();
      expect(onExit).toBeDefined();
    });
  });
});
