import type { Framework } from '../framework/framework-contract';

// Base preset structure - what each framework allows by default
export type FrameworkPreset = {
  widgets: string[] | null; // null = folder not allowed
  bindings: string[] | null; // null = folder not allowed
  state: string[] | null; // null = folder not allowed
  flows: string[] | null; // null = folder not allowed
  responders: string[] | null; // null = folder not allowed
  contracts: string[]; // Schema libraries will be added here
  brokers: string[]; // Usually empty
  transformers: string[]; // Usually empty
  errors: string[]; // Usually empty
  middleware: string[]; // Usually empty
  adapters: string[]; // Usually ["*"] (unrestricted)
  startup: string[]; // Usually ["*"] (unrestricted)
};

// Frontend frameworks (have UI components)
const FRONTEND_BASE_PRESET: FrameworkPreset = {
  widgets: [], // Will be populated with framework-specific packages
  bindings: [], // Will be populated with framework-specific packages
  state: [], // Will be populated with framework-specific packages
  flows: [], // Will be populated with routing library
  responders: [],
  contracts: [], // Will be populated with schema libraries
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
};

// Backend frameworks (no UI)
const BACKEND_BASE_PRESET: FrameworkPreset = {
  widgets: null, // No UI folders in backend
  bindings: null, // No UI folders in backend
  state: [], // Backend can have state (caches, sessions)
  flows: [], // Will be populated with backend framework itself
  responders: [],
  contracts: [], // Will be populated with schema libraries
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
};

// Library presets (no flows/)
const NODE_LIBRARY_BASE_PRESET: FrameworkPreset = {
  widgets: null, // No UI folders in node libraries
  bindings: null, // No UI folders in node libraries
  state: [],
  flows: null, // No flows in libraries
  responders: null, // No responders in libraries
  contracts: [], // Will be populated with schema libraries
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
};

const REACT_LIBRARY_BASE_PRESET: FrameworkPreset = {
  widgets: [], // Will be populated with react packages
  bindings: [], // Will be populated with react packages
  state: [], // Will be populated with react packages
  flows: null, // No flows in libraries
  responders: null, // No responders in libraries
  contracts: [], // Will be populated with schema libraries
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
};

// CLI presets
const CLI_BASE_PRESET: FrameworkPreset = {
  widgets: null, // No UI folders for non-Ink CLIs
  bindings: null, // No UI folders for non-Ink CLIs
  state: [],
  flows: null, // No flows in CLIs
  responders: null, // No responders in CLIs
  contracts: [], // Will be populated with schema libraries
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
};

const INK_CLI_BASE_PRESET: FrameworkPreset = {
  widgets: [], // Will be populated with ink packages
  bindings: [], // Will be populated with ink packages
  state: [], // Will be populated with ink packages
  flows: null, // CLI screens/commands instead of routes
  responders: null, // Commands handle their own responses
  contracts: [], // Will be populated with schema libraries
  brokers: [],
  transformers: [],
  errors: [],
  middleware: [],
  adapters: ['*'],
  startup: ['*'],
};

// All framework presets
export const FRAMEWORK_PRESETS: Record<Framework, FrameworkPreset> = {
  // Frontend frameworks
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

  // Backend frameworks
  express: {
    ...BACKEND_BASE_PRESET,
    flows: ['express'], // Express IS the router
  },
  fastify: {
    ...BACKEND_BASE_PRESET,
    flows: ['fastify'], // Fastify IS the router
  },
  koa: {
    ...BACKEND_BASE_PRESET,
    flows: ['koa', '@koa/router'], // Koa + router
  },
  hapi: {
    ...BACKEND_BASE_PRESET,
    flows: ['@hapi/hapi'], // Hapi IS the router
  },
  nestjs: {
    ...BACKEND_BASE_PRESET,
    flows: ['@nestjs/core', '@nestjs/common'], // NestJS modules
  },

  // Fullstack frameworks
  nextjs: {
    ...FRONTEND_BASE_PRESET,
    widgets: ['react', 'react-dom', 'next'],
    bindings: ['react', 'react-dom', 'next'],
    state: ['react', 'react-dom', 'next'],
    flows: ['next'], // Next.js router
  },
  nuxtjs: {
    ...FRONTEND_BASE_PRESET,
    widgets: ['vue', 'nuxt'],
    bindings: ['vue', 'nuxt'],
    state: ['vue', 'nuxt'],
    flows: ['nuxt'], // Nuxt.js router
  },
  remix: {
    ...FRONTEND_BASE_PRESET,
    widgets: ['react', 'react-dom', '@remix-run/react'],
    bindings: ['react', 'react-dom', '@remix-run/react'],
    state: ['react', 'react-dom', '@remix-run/react'],
    flows: ['@remix-run/react'], // Remix router
  },

  // Libraries
  'node-library': NODE_LIBRARY_BASE_PRESET,
  'react-library': {
    ...REACT_LIBRARY_BASE_PRESET,
    widgets: ['react', 'react-dom'],
    bindings: ['react', 'react-dom'],
    state: ['react', 'react-dom'],
  },

  // CLI tools
  cli: CLI_BASE_PRESET,
  'ink-cli': {
    ...INK_CLI_BASE_PRESET,
    widgets: ['ink', 'react'],
    bindings: ['ink', 'react'],
    state: ['ink', 'react'],
  },

  // Monorepo root
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
};
