# Lint Configuration Sets

This document defines the configuration values that drive the lint rules in `rulesets.md`. These configurations allow
projects to customize enforcement while maintaining architectural patterns.

**IMPORTANT: Configurations apply only to `src/` and its subdirectories.**

## Installation and Configuration

This architecture lint ruleset is distributed as part of the @questmaestro suite of lint elevators.

### Installation

```bash
npm install --save-dev @questmaestro/lint
```

### ESLint Configuration

Enable the rules in your ESLint config:

```javascript
// eslint.config.js (root)
module.exports = {
    plugins: ['@questmaestro/lint'],
    extends: ['plugin:@questmaestro/lint/recommended']
};
```

### Architecture Configuration

Each package with a `package.json` should have a `.questmaestro` file that defines its architecture:

```javascript
// .questmaestro - Simple preset-based configuration
module.exports = {
    framework: "react",           // Required: Sets the base preset
    routing: "react-router-dom",  // Required for frontend/backend apps (not libraries)
    schema: "zod",                 // Primary validation library
    // Or use multiple validation libraries:
    // schema: ["zod", "yup"],    // Both available in contracts/

    // Optional: Override specific folders from the preset
    architecture: {
        overrides: {
            "state": {add: ["zustand"]},     // Add zustand to React's state defaults
            "middleware": {add: ["pino"]}    // Add pino to middleware
        },
        // Optional: Customize other settings
        allowedRootFiles: ["global.d.ts", "env.d.ts"],
        booleanFunctionPrefixes: ["is", "has", "can", "should", "will", "was", "are"]
    }
};
```

### Framework Values

The `framework` field must be one of these exact values:

```typescript
type Framework =
// Frontend frameworks (implies widgets/, bindings/, frontend responders)
    | "react"
    | "vue"
    | "angular"
    | "svelte"
    | "solid"
    | "preact"

    // Backend frameworks (implies no widgets/, backend responders)
    | "express"
    | "fastify"
    | "koa"
    | "hapi"
    | "nestjs"

    // Fullstack
    | "nextjs"
    | "nuxtjs"
    | "remix"

    // Libraries/Tools
    | "node-library"   // No flows/, pure Node.js library
    | "react-library"  // Component library with widgets/
    | "cli"           // CLI tool with startup/
    | "ink-cli"       // React-based terminal UI with Ink

    // Monorepo
    | "monorepo";     // Root of monorepo, packages have their own frameworks
```

### How It Works

1. When linting a file, `@questmaestro/lint` looks up the directory tree for the nearest `.questmaestro` file
2. The `framework` field selects a preset that automatically configures 90% of folder imports
3. The `routing` and `schema` fields configure the remaining framework-specific packages
4. Optional `overrides` let you add or modify specific folder configurations
5. In monorepos, the root `.questmaestro` can provide shared defaults that all packages inherit

### Framework Presets

Each framework automatically configures the appropriate packages for each folder:

#### Frontend Presets (react, vue, angular, svelte, solid, preact)

```json
// Example: framework: "react" automatically provides:
{
  "widgets": "react",
  // Framework determines packages (react, react-dom)
  "bindings": "react",
  // Framework determines packages (react, react-dom)
  "state": "react",
  // Framework determines packages (react, react-dom)
  "flows": [
    routing
  ],
  // Uses your routing field value
  "contracts": [
    schema
  ],
  // Uses your schema field value
  "brokers": [],
  "transformers": [],
  "errors": [],
  "middleware": [],
  "responders": [],
  "startup": [
    "*"
  ]
}
```

#### Backend Presets (express, fastify, koa, hapi, nestjs)

```json
// Example: framework: "express" automatically provides:
{
  "flows": "express",
  // Backend framework is its own router
  "contracts": [
    schema
  ],
  // Uses your schema field value
  "brokers": [],
  "transformers": [],
  "errors": [],
  "middleware": [],
  "responders": [],
  "state": null,
  // No UI packages in backend
  "widgets": null,
  // No widgets in backend
  "bindings": null,
  // No bindings in backend
  "startup": [
    "*"
  ]
}
```

#### Library Presets (node-library, react-library)

```json
// Example: framework: "react-library" automatically provides:
{
  "widgets": "react",
  // Framework determines packages
  "bindings": "react",
  // Framework determines packages
  "state": "react",
  // Framework determines packages
  "contracts": [
    schema
  ],
  // Uses your schema field value
  "transformers": [],
  "brokers": [],
  "errors": [],
  "flows": null,
  // No flows in libraries
  "responders": null
  // No responders in libraries
}

// Example: framework: "node-library" automatically provides:
{
  "contracts": [
    schema
  ],
  // Uses your schema field value
  "transformers": [],
  "brokers": [],
  "errors": [],
  "state": [],
  "widgets": null,
  // No UI folders in node libraries
  "bindings": null,
  // No UI folders in node libraries
  "flows": null,
  // No flows in libraries
  "responders": null
  // No responders in libraries
}
```

#### CLI Presets (cli, ink-cli)

```json
// Example: framework: "ink-cli" automatically provides:
{
  "widgets": "ink",
  // Ink framework (includes react)
  "bindings": "ink",
  // Ink framework (includes react)
  "state": "ink",
  // Ink framework (includes react)
  "flows": null,
  // CLI screens/commands instead of routes
  "responders": null,
  // Commands handle their own responses
  "contracts": [
    schema
  ],
  // Uses your schema field value(s)
  "brokers": [],
  "transformers": [],
  "errors": [],
  "middleware": [],
  "startup": [
    "*"
  ]
  // CLI entry point and command setup
}

// Example: framework: "cli" automatically provides:
{
  "contracts": [
    schema
  ],
  // Uses your schema field value(s)
  "brokers": [],
  "transformers": [],
  "errors": [],
  "state": [],
  "startup": [
    "*"
  ],
  // CLI entry point
  "widgets": null,
  // No UI folders for non-Ink CLIs
  "bindings": null,
  // No UI folders for non-Ink CLIs
  "flows": null,
  // No flows in CLIs
  "responders": null
  // No responders in CLIs
}
```

### Monorepo Example

```
monorepo/
├── eslint.config.js              # Enables @questmaestro/lint
├── .questmaestro                 # Root config (shared defaults)
├── packages/
│   ├── web/
│   │   ├── package.json
│   │   ├── .questmaestro        # framework: "react" (overrides root)
│   │   └── src/
│   │       ├── widgets/
│   │       └── flows/
│   ├── api/
│   │   ├── package.json
│   │   ├── .questmaestro        # framework: "express" (overrides root)
│   │   └── src/
│   │       ├── brokers/
│   │       └── flows/
│   └── shared/
│       ├── package.json
│       ├── .questmaestro        # framework: "node-library" (overrides root)
│       └── src/
│           ├── contracts/
│           └── transformers/
```

### Root .questmaestro Example (Monorepo)

```javascript
// Root .questmaestro - shared defaults for all packages
module.exports = {
    framework: "monorepo",  // Indicates this is a monorepo root

    // Shared settings that all packages inherit (unless overridden)
    architecture: {
        allowedRootFiles: ["global.d.ts"],
        booleanFunctionPrefixes: ["is", "has", "can", "should", "will", "was"]
    }
};

// packages/web/.questmaestro - Frontend package
module.exports = {
    framework: "react",
    routing: "react-router-dom",
    schema: "zod"
};

// packages/api/.questmaestro - Backend package
module.exports = {
    framework: "express",
    schema: "joi"
    // No routing field needed - express IS the router
};

// packages/shared/.questmaestro - Shared library
module.exports = {
    framework: "node-library",
    schema: "zod"  // Same validation as frontend for consistency
};
```

## Configuration Type Definition

```typescript
export type Framework =
    | "react" | "vue" | "angular" | "svelte" | "solid" | "preact"  // Frontend
    | "express" | "fastify" | "koa" | "hapi" | "nestjs"            // Backend
    | "nextjs" | "nuxtjs" | "remix"                                // Fullstack
    | "node-library" | "react-library"                             // Libraries
    | "cli" | "ink-cli"                                           // CLI tools
    | "monorepo";                                                  // Monorepo root

export type SchemaLibrary = "zod" | "yup" | "joi" | "io-ts" | "typebox" | "class-validator";

export type RoutingLibrary =
    | "react-router-dom" | "vue-router" | "@angular/router"  // Frontend routers
    | "express" | "fastify" | "koa" | "hapi";                // Backend frameworks (act as routers)

export type QuestmaestroConfig = {
    framework: Framework;                           // Required: Sets the preset
    routing?: RoutingLibrary;                       // Required for apps, not for libraries
    schema: SchemaLibrary | SchemaLibrary[];        // Required: Validation library/libraries

    architecture?: {
        overrides?: {
            [folder: string]: {
                add?: string[];              // Add packages to the preset
            };
        };
        allowedRootFiles?: string[];    // Files allowed in src/ root
        booleanFunctionPrefixes?: string[];  // Prefixes for boolean functions
    };

    // Other questmaestro configs (hooks, etc.)
};

// Example: React Frontend Project (.questmaestro)
module.exports = {
    framework: "react",
    routing: "react-router-dom",
    schema: "zod",

    // Optional: Add zustand to state management
    architecture: {
        overrides: {
            "state": {add: ["zustand"]}
        }
    }
};

// Example: Express Backend Project (.questmaestro)
module.exports = {
    framework: "express",
    schema: "joi"
    // No routing field needed - express IS the router
    // No overrides needed - preset handles everything
};

// Example: Vue Frontend Project (.questmaestro)
module.exports = {
    framework: "vue",
    routing: "vue-router",
    schema: "yup",

    // Optional: Add state management
    architecture: {
        overrides: {
            "state": {add: ["pinia"]}
        }
    }
};

// Example: Project using multiple validation libraries (.questmaestro)
module.exports = {
    framework: "react",
    routing: "react-router-dom",
    schema: ["zod", "yup"],  // Both libraries available in contracts/
    // Useful during migration from one to another
};

// Example: React Component Library (.questmaestro)
module.exports = {
    framework: "react-library",
    schema: "zod"
    // No routing needed for libraries
};

// Example: Node.js Utility Library (.questmaestro)
module.exports = {
    framework: "node-library",
    schema: "joi"
    // No routing or UI packages needed
};

// Example: Ink CLI with screens (.questmaestro)
module.exports = {
    framework: "ink-cli",
    schema: "zod",
    // No routing - CLIs use commands/screens, not routes

    // Optional: Add commander or yargs for command parsing
    architecture: {
        overrides: {
            "startup": {add: ["commander"]}
        }
    }
};
```

---

## Config Transformation Layer

The lint rules don't directly use the simplified config. Instead, there's a transformation layer that converts the
high-level config into the computed `allowedExternalImports` structure that the rules actually check against.

### Input (User Config)

```javascript
// .questmaestro
module.exports = {
    framework: "react",
    routing: "react-router-dom",
    schema: "zod",
    architecture: {
        overrides: {
            "state": {add: ["zustand"]}
        }
    }
};
```

### Transformation (DTO Layer)

```javascript
// The config loader transforms the above into:
function computeAllowedExternalImports(config) {
    const preset = getPresetForFramework(config.framework);
    const computed = {
        // Framework determines base packages
        "widgets": preset.widgets === "react" ? ["react", "react-dom"] : [],
        "bindings": preset.bindings === "react" ? ["react", "react-dom"] : [],
        "state": preset.state === "react" ? ["react", "react-dom"] : [],

        // Routing field populates flows
        "flows": config.routing ? [config.routing] : [],

        // Schema field populates contracts (can be array)
        "contracts": Array.isArray(config.schema) ? config.schema : [config.schema],

        // Fixed presets
        "brokers": [],
        "transformers": [],
        "errors": [],
        "middleware": [],
        "responders": [],
        "startup": ["*"],
        "adapters": ["*"]  // Always unrestricted
    };

    // Apply overrides
    if (config.architecture?.overrides) {
        for (const [folder, override] of Object.entries(config.architecture.overrides)) {
            if (override.add) {
                computed[folder] = [...computed[folder], ...override.add];
            }
        }
    }

    return computed;
}
```

### Output (What Lint Rules Use)

```json
// The computed structure that lint rules actually check:
{
  "allowedExternalImports": {
    "widgets": [
      "react",
      "react-dom"
    ],
    "bindings": [
      "react",
      "react-dom"
    ],
    "state": [
      "react",
      "react-dom",
      "zustand"
    ],
    // Added zustand via override
    "flows": [
      "react-router-dom"
    ],
    "contracts": [
      "zod"
    ],
    "brokers": [],
    "transformers": [],
    "errors": [],
    "middleware": [],
    "responders": [],
    "startup": [
      "*"
    ],
    "adapters": [
      "*"
    ]
    }
}
```

This transformation happens when the lint rules load, so the rules themselves can continue to check against
`allowedExternalImports.widgets` etc., while users only need to specify the high-level framework choice.

---

## Additional Configuration Options

These settings can be customized in the `architecture` section of your `.questmaestro` file:

### Allowed Root-Level Files

**Purpose**: Define exceptions to folder structure rules for files in `src/` root.

**Default**: `["global.d.ts"]`

**Example:**

```javascript
module.exports = {
    framework: "react",
    routing: "react-router-dom",
    schema: "zod",

    architecture: {
        allowedRootFiles: ["global.d.ts", "env.d.ts", "vite-env.d.ts"]
    }
};
```

### Boolean Function Prefixes

**Purpose**: Define recognized prefixes for boolean-returning functions in contracts/.

**Default**: `["is", "has", "can", "should", "will", "was"]`

**Example:**

```javascript
module.exports = {
    framework: "express",
    schema: "joi",

    architecture: {
        // Add domain-specific prefixes
        booleanFunctionPrefixes: ["is", "has", "can", "should", "will", "was", "are", "were", "does"]
    }
};
```

---