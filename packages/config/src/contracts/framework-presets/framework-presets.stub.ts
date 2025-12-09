import type { StubArgument } from '@dungeonmaster/shared/@types';
import { frameworkPresetsContract } from './framework-presets-contract';
import type { FrameworkPreset } from './framework-presets-contract';

export { frameworkPresetsContract };

export const FrameworkPresetStub = ({
  ...props
}: StubArgument<FrameworkPreset> = {}): FrameworkPreset =>
  frameworkPresetsContract.parse({
    widgets: ['react', 'react-dom'],
    bindings: ['react', 'react-dom'],
    state: ['react', 'react-dom'],
    flows: [],
    responders: [],
    contracts: [],
    brokers: [],
    transformers: [],
    errors: [],
    middleware: [],
    adapters: ['*'],
    startup: ['*'],
    ...props,
  });

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
};

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
};

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
};

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
};

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
};

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
};

// All framework presets - each preset validated through contract.parse()
export const FRAMEWORK_PRESETS = {
  react: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['react', 'react-dom'],
    bindings: ['react', 'react-dom'],
    state: ['react', 'react-dom'],
  }),
  vue: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['vue'],
    bindings: ['vue'],
    state: ['vue'],
  }),
  angular: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['@angular/core', '@angular/common'],
    bindings: ['@angular/core', '@angular/common'],
    state: ['@angular/core', '@angular/common'],
  }),
  svelte: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['svelte'],
    bindings: ['svelte'],
    state: ['svelte'],
  }),
  solid: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['solid-js'],
    bindings: ['solid-js'],
    state: ['solid-js'],
  }),
  preact: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['preact'],
    bindings: ['preact'],
    state: ['preact'],
  }),
  express: frameworkPresetsContract.parse({
    ...BACKEND_BASE_PRESET,
    flows: ['express'],
  }),
  fastify: frameworkPresetsContract.parse({
    ...BACKEND_BASE_PRESET,
    flows: ['fastify'],
  }),
  koa: frameworkPresetsContract.parse({
    ...BACKEND_BASE_PRESET,
    flows: ['koa', '@koa/router'],
  }),
  hapi: frameworkPresetsContract.parse({
    ...BACKEND_BASE_PRESET,
    flows: ['@hapi/hapi'],
  }),
  nestjs: frameworkPresetsContract.parse({
    ...BACKEND_BASE_PRESET,
    flows: ['@nestjs/core', '@nestjs/common'],
  }),
  nextjs: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['react', 'react-dom', 'next'],
    bindings: ['react', 'react-dom', 'next'],
    state: ['react', 'react-dom', 'next'],
    flows: ['next'],
  }),
  nuxtjs: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['vue', 'nuxt'],
    bindings: ['vue', 'nuxt'],
    state: ['vue', 'nuxt'],
    flows: ['nuxt'],
  }),
  remix: frameworkPresetsContract.parse({
    ...FRONTEND_BASE_PRESET,
    widgets: ['react', 'react-dom', '@remix-run/react'],
    bindings: ['react', 'react-dom', '@remix-run/react'],
    state: ['react', 'react-dom', '@remix-run/react'],
    flows: ['@remix-run/react'],
  }),
  'node-library': frameworkPresetsContract.parse(NODE_LIBRARY_BASE_PRESET),
  'react-library': frameworkPresetsContract.parse({
    ...REACT_LIBRARY_BASE_PRESET,
    widgets: ['react', 'react-dom'],
    bindings: ['react', 'react-dom'],
    state: ['react', 'react-dom'],
  }),
  cli: frameworkPresetsContract.parse(CLI_BASE_PRESET),
  'ink-cli': frameworkPresetsContract.parse({
    ...INK_CLI_BASE_PRESET,
    widgets: ['ink', 'react'],
    bindings: ['ink', 'react'],
    state: ['ink', 'react'],
  }),
  monorepo: frameworkPresetsContract.parse({
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
  }),
} as const satisfies Record<string, FrameworkPreset>;
