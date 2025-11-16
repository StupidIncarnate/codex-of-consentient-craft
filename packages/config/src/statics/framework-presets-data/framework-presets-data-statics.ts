/**
 * PURPOSE: Provides framework-specific preset configurations for allowed external package imports
 *
 * USAGE:
 * import {frameworkPresetsDataStatics} from './framework-presets-data-statics';
 * const reactPreset = frameworkPresetsDataStatics.presets.react;
 * // Returns preset configuration with allowed packages for React framework
 */

// Frontend frameworks (have UI components)
const FRONTEND_BASE_PRESET = {
  widgets: [],
  bindings: [],
  state: [],
  flows: [],
  responders: [],
  contracts: [],
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
} as const;

// Backend frameworks (no UI)
const BACKEND_BASE_PRESET = {
  widgets: null,
  bindings: null,
  state: [],
  flows: [],
  responders: [],
  contracts: [],
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
} as const;

// Library presets (no flows/)
const NODE_LIBRARY_BASE_PRESET = {
  widgets: null,
  bindings: null,
  state: [],
  flows: null,
  responders: null,
  contracts: [],
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
} as const;

const REACT_LIBRARY_BASE_PRESET = {
  widgets: [],
  bindings: [],
  state: [],
  flows: null,
  responders: null,
  contracts: [],
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
} as const;

// CLI presets
const CLI_BASE_PRESET = {
  widgets: null,
  bindings: null,
  state: [],
  flows: null,
  responders: null,
  contracts: [],
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
} as const;

const INK_CLI_BASE_PRESET = {
  widgets: [],
  bindings: [],
  state: [],
  flows: null,
  responders: null,
  contracts: [],
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
} as const;

export const frameworkPresetsDataStatics = {
  presets: {
    react: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['react', 'react-dom'],
      bindings: ['react', 'react-dom'],
      state: ['react', 'react-dom'],
    },
    vue: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['vue'],
      bindings: ['vue'],
      state: ['vue'],
    },
    angular: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['@angular/core', '@angular/common'],
      bindings: ['@angular/core', '@angular/common'],
      state: ['@angular/core', '@angular/common'],
    },
    svelte: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['svelte'],
      bindings: ['svelte'],
      state: ['svelte'],
    },
    solid: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['solid-js'],
      bindings: ['solid-js'],
      state: ['solid-js'],
    },
    preact: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['preact'],
      bindings: ['preact'],
      state: ['preact'],
    },
    express: {
      ...BACKEND_BASE_PRESET,
      flows: ['express'],
    },
    fastify: {
      ...BACKEND_BASE_PRESET,
      flows: ['fastify'],
    },
    koa: {
      ...BACKEND_BASE_PRESET,
      flows: ['koa', '@koa/router'],
    },
    hapi: {
      ...BACKEND_BASE_PRESET,
      flows: ['@hapi/hapi'],
    },
    nestjs: {
      ...BACKEND_BASE_PRESET,
      flows: ['@nestjs/core', '@nestjs/common'],
    },
    nextjs: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['react', 'react-dom', 'next'],
      bindings: ['react', 'react-dom', 'next'],
      state: ['react', 'react-dom', 'next'],
      flows: ['next'],
    },
    nuxtjs: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['vue', 'nuxt'],
      bindings: ['vue', 'nuxt'],
      state: ['vue', 'nuxt'],
      flows: ['nuxt'],
    },
    remix: {
      ...FRONTEND_BASE_PRESET,
      widgets: ['react', 'react-dom', '@remix-run/react'],
      bindings: ['react', 'react-dom', '@remix-run/react'],
      state: ['react', 'react-dom', '@remix-run/react'],
      flows: ['@remix-run/react'],
    },
    'node-library': NODE_LIBRARY_BASE_PRESET,
    'react-library': {
      ...REACT_LIBRARY_BASE_PRESET,
      widgets: ['react', 'react-dom'],
      bindings: ['react', 'react-dom'],
      state: ['react', 'react-dom'],
    },
    cli: CLI_BASE_PRESET,
    'ink-cli': {
      ...INK_CLI_BASE_PRESET,
      widgets: ['ink', 'react'],
      bindings: ['ink', 'react'],
      state: ['ink', 'react'],
    },
    monorepo: {
      widgets: null,
      bindings: null,
      state: null,
      flows: null,
      responders: null,
      contracts: [],
      brokers: [],
      transformers: [],
      errors: [],
      middleware: [],
      adapters: ['*'],
      startup: ['*'],
    },
  } as const,
} as const;
