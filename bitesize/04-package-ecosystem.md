# Package Ecosystem Design

## Overview

Quest Maestro standards are distributed as a suite of npm packages that consumer projects install. Documentation lives
in `node_modules/` and auto-syncs when packages update.

## Package Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Framework Packages (Published to NPM)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  @questmaestro/standards                                     │
│  ├── docs/                    ← Claude documentation         │
│  │   ├── core-rules.md                                       │
│  │   ├── folders/                                            │
│  │   ├── decisions/                                          │
│  │   └── anti-patterns/                                      │
│  ├── templates/               ← Starter code                 │
│  │   ├── first-10-files/                                     │
│  │   └── claude-config/                                      │
│  ├── bin/                     ← CLI tools                    │
│  │   └── init-claude-docs.js  ← Post-install script          │
│  └── package.json                                            │
│                                                               │
│  @questmaestro/testing                                       │
│  ├── docs/                                                   │
│  │   └── testing-standards.md                                │
│  └── templates/                                              │
│      └── test-examples/                                      │
│                                                               │
│  @questmaestro/eslint-plugin                                 │
│  ├── rules/                   ← Enforcement                  │
│  ├── configs/                                                │
│  └── docs/                                                   │
│      └── rule-explanations.md                                │
│                                                               │
│  @questmaestro/hooks                                         │
│  ├── pre-commit/              ← Claude pre-edit hooks        │
│  └── docs/                                                   │
│      └── hook-configuration.md                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Package Responsibilities

### @questmaestro/standards (Core)

**Purpose:** Architectural standards, folder structure, naming patterns

**Contents:**

- Documentation (docs/)
    - `core-rules.md` - Universal rules (300 lines)
    - `folders/` - Task-specific guides (350-450 lines each)
    - `decisions/` - Decision trees (300-400 lines each)
    - `anti-patterns/` - Training data traps (400 lines)

- Templates (templates/)
    - `CLAUDE.md.template` - Root orchestrator template
    - `first-10-files/` - Starter scaffold with embedded patterns
    - `folder-claude-md/` - Folder-specific CLAUDE.md templates

- CLI Tools (bin/)
    - `init-claude-docs.js` - Post-install setup script
    - `scaffold.js` - Generate starter files

**Key Exports:**

```javascript
// Programmatic API
module.exports = {
    initDocs: require('./bin/init-claude-docs'),
    scaffold: require('./bin/scaffold'),
    paths: {
        docs: path.join(__dirname, 'docs'),
        templates: path.join(__dirname, 'templates')
    }
};
```

### @questmaestro/testing

**Purpose:** Testing patterns, stub generation, test structure

**Dependencies:** `@questmaestro/standards` (references folder structure)

**Contents:**

- `docs/testing-standards.md` - Test architecture
- `templates/test-examples/` - Example test files
- `utils/stub-generator.js` - Programmatic stub creation

**Cross-references:**

```markdown
<!-- In testing-standards.md -->
See: `.claude/_framework/standards/folders/contracts-guide.md#stubs` for stub patterns
```

### @questmaestro/eslint-plugin

**Purpose:** Enforce architectural rules via lint

**Dependencies:** `@questmaestro/standards` (validates against same rules)

**Contents:**

- `rules/` - ESLint rule implementations
    - `folder-structure.js` - Enforce allowed folders
    - `branded-types.js` - Require branded Zod types
    - `single-export.js` - One export per file
    - `naming-patterns.js` - Validate file naming

- `configs/` - Preset configurations
    - `recommended.js` - Standard ruleset
    - `strict.js` - Zero tolerance

- `docs/rule-explanations.md` - Pedagogical error messages

**Pedagogical Errors:**

```javascript
// rules/branded-types.js
module.exports = {
  create(context) {
    return {
      TSTypeAnnotation(node) {
        if (isRawPrimitive(node)) {
          context.report({
            node,
            message: [
              'Raw primitive type detected. Use branded Zod types instead.',
              '',
              'Found: string',
              'Expected: UserId (from userIdContract)',
              '',
              'See: .claude/_framework/standards/core-rules.md#branded-types',
              'See: .claude/_framework/lint/rule-explanations.md#branded-types'
            ].join('\n')
          });
        }
      }
    };
  }
};
```

### @questmaestro/hooks

**Purpose:** Pre-commit and pre-edit hooks for Claude integration

**Dependencies:**

- `@questmaestro/standards` (loads context intelligently)
- `@questmaestro/eslint-plugin` (runs validation)

**Contents:**

- `pre-commit/` - Git hooks
    - `validate-structure.js` - Check folder structure
    - `check-claude-compliance.js` - Run Claude-specific checks

- `pre-edit/` - Claude Code hooks (if supported)
    - `load-context.js` - Intelligent context loading
    - `suggest-guide.js` - Suggest which guide to read

## Package Interdependencies

```
@questmaestro/standards (base)
  ├── No dependencies
  └── Provides: docs, templates, scaffold

@questmaestro/testing
  ├── Depends on: @questmaestro/standards
  └── References: folder structure, contract patterns

@questmaestro/eslint-plugin
  ├── Depends on: @questmaestro/standards
  ├── Validates: same rules as docs
  └── Provides: pedagogical error messages

@questmaestro/hooks
  ├── Depends on: @questmaestro/standards, @questmaestro/eslint-plugin
  └── Orchestrates: context loading, validation

Consumer Project
  ├── Installs: all @questmaestro/* packages
  ├── Gets: auto-setup via post-install
  └── Receives: docs, enforcement, templates
```

## Version Management Strategy

### SemVer Alignment

All packages use synchronized versioning:

```json
// @questmaestro/standards package.json
{
  "name": "@questmaestro/standards",
  "version": "1.2.0",
  "peerDependencies": {}
}

// @questmaestro/testing package.json
{
  "name": "@questmaestro/testing",
  "version": "1.2.0",
  "peerDependencies": {
    "@questmaestro/standards": "^1.0.0"
  }
}

// @questmaestro/eslint-plugin package.json
{
  "name": "@questmaestro/eslint-plugin",
  "version": "1.2.0",
  "peerDependencies": {
    "@questmaestro/standards": "^1.0.0"
  }
}
```

### Version Compatibility Check

**In init script:**

```javascript
// @questmaestro/standards/bin/init-claude-docs.js

function checkVersionAlignment() {
  const pkgJson = require(path.join(process.cwd(), 'package.json'));
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

  const standardsVersion = deps['@questmaestro/standards'];
  const eslintVersion = deps['@questmaestro/eslint-plugin'];
  const testingVersion = deps['@questmaestro/testing'];

  const standardsMajor = getMajorVersion(standardsVersion);
  const eslintMajor = getMajorVersion(eslintVersion);
  const testingMajor = getMajorVersion(testingVersion);

  if (standardsMajor !== eslintMajor || standardsMajor !== testingMajor) {
    console.warn(`
⚠️  WARNING: Version mismatch detected!

  @questmaestro/standards:     ${standardsVersion}
  @questmaestro/eslint-plugin: ${eslintVersion}
  @questmaestro/testing:        ${testingVersion}

All @questmaestro packages should have matching major versions.
Run: npm update @questmaestro/standards @questmaestro/testing @questmaestro/eslint-plugin
    `);
  }
}
```

### Release Strategy

**Versioning (SemVer):**

| Change Type | Version | Example                                    | Breaking? |
|-------------|---------|--------------------------------------------|-----------|
| **Major**   | 2.0.0   | Folder structure change, required patterns | Yes       |
| **Minor**   | 1.1.0   | New guides, new optional patterns          | No        |
| **Patch**   | 1.0.1   | Fix typos, clarify examples                | No        |

**Coordinated Release Process:**

```bash
# 1. Update all packages together (major/minor)
cd packages/standards && npm version minor
cd packages/testing && npm version minor
cd packages/eslint-plugin && npm version minor
cd packages/hooks && npm version minor

# 2. Publish all packages
npm publish --access public --workspace @questmaestro/standards
npm publish --access public --workspace @questmaestro/testing
npm publish --access public --workspace @questmaestro/eslint-plugin
npm publish --access public --workspace @questmaestro/hooks

# 3. Update CHANGELOG.md in each package
# 4. Tag release
git tag v1.1.0
git push && git push --tags
```

## Consumer Installation Flow

### Step 1: Install Packages

```bash
npm install --save-dev \
  @questmaestro/standards \
  @questmaestro/testing \
  @questmaestro/eslint-plugin \
  @questmaestro/hooks
```

### Step 2: Post-Install Auto-Runs

**Triggered by:** `@questmaestro/standards` postinstall script

```json
// @questmaestro/standards/package.json
{
  "scripts": {
    "postinstall": "node ./bin/init-claude-docs.js || true"
  }
}
```

**Creates:**

```
.claude/
├── .gitignore
├── _framework/          ← Symlinked to node_modules/@questmaestro/
│   ├── standards/
│   ├── testing/
│   └── lint/
└── custom/              ← Committed, project-specific
    └── README.md
```

### Step 3: Developer Scaffolds (Optional)

```bash
npx @questmaestro/standards scaffold
```

**Generates starter files with embedded patterns.**

## Documentation Discovery

### Path Structure

**Framework docs (symlinked):**

```
.claude/_framework/
├── standards/
│   ├── core-rules.md
│   ├── folders/
│   │   ├── contracts-guide.md
│   │   ├── brokers-guide.md
│   │   └── [etc...]
│   ├── decisions/
│   │   ├── extend-vs-create.md
│   │   └── which-folder.md
│   └── anti-patterns/
│       └── training-data-traps.md
├── testing/
│   └── testing-standards.md
└── lint/
    └── rule-explanations.md
```

**Custom docs (committed):**

```
.claude/custom/
├── README.md
├── business-domain.md
├── tech-stack.md
└── api-endpoints.md
```

### Claude Loading Paths

**Clean, predictable paths:**

```markdown
Load: `.claude/_framework/standards/core-rules.md`
Load: `.claude/_framework/standards/folders/brokers-guide.md`
Load: `.claude/_framework/testing/testing-standards.md`
Load: `.claude/custom/business-domain.md`
```

**Benefits:**

- ✅ No verbose `node_modules/@questmaestro/standards/docs/` paths
- ✅ Framework vs custom clearly separated
- ✅ Auto-updates with npm (symlinks)
- ✅ `.gitignore` prevents committing framework docs

## Package Distribution Benefits

| Benefit               | How It Works                                               |
|-----------------------|------------------------------------------------------------|
| **Auto-sync docs**    | Symlinks reflect updated node_modules/                     |
| **Version control**   | npm manages doc versions                                   |
| **Easy updates**      | `npm update` gets latest patterns                          |
| **Consistent paths**  | Always `.claude/_framework/` regardless of package version |
| **No manual copying** | Post-install script automates setup                        |
| **Project isolation** | Each project gets its own .claude/                         |
| **Customization**     | .claude/custom/ for project-specific docs                  |

## Cross-Package References

**From @questmaestro/testing to @questmaestro/standards:**

```markdown
<!-- @questmaestro/testing/docs/testing-standards.md -->

# Testing Standards

**Prerequisites:** Familiarity with Quest Maestro folder structure and naming.

**Read first:**

- `.claude/_framework/standards/core-rules.md` (10 min)

**This guide assumes you understand:**

- Branded Zod types (from core-rules)
- Single responsibility per file (from core-rules)
- Folder structure (contracts/, brokers/, etc.)

## Testing Contracts

See: `.claude/_framework/standards/folders/contracts-guide.md#stubs`

Stubs live in contracts/ alongside their contracts...
```

**Benefits:**

- ✅ DRY principle (no duplication)
- ✅ Clear dependencies
- ✅ Links work regardless of package versions
- ✅ Consistent paths

## Key Takeaways

1. **npm distribution** - Documentation is versioned, dependency-managed code
2. **Symlink strategy** - Auto-sync without manual copying
3. **Clean paths** - `.claude/_framework/` hides implementation details
4. **Version alignment** - All packages coordinate major versions
5. **Post-install automation** - Zero manual setup for consumers
6. **Separation of concerns** - Framework vs custom docs clearly divided

## Next Steps

- **[Documentation Distribution](05-documentation-distribution.md)** - Deep dive on symlink strategy
- **[The Init Script](06-init-script.md)** - How post-install automation works
- **[Multi-Package Integration](09-multi-package-integration.md)** - How packages reference each other
