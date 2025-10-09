# Quick Start Guide - Quest Maestro npm Distribution

## The Problem

Quest Maestro's 1780-line standards document causes LLM attention decay:

- Rules 1000+ lines apart have weak activation
- LLM forgets early rules when processing later sections
- Falls back to training data patterns (the original problem!)

## The Solution

**Progressive context loading via npm packages:**

1. Split docs into focused chunks (< 500 lines each)
2. Distribute via `@questmaestro/*` packages
3. Auto-sync with symlinks from `node_modules/`
4. Load only what's needed per task (~1000 lines max)
5. Enforce with ESLint (catches what LLM forgets)

## Quick Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  NPM Packages                                    │
│  ├── @questmaestro/standards  (docs + templates)│
│  ├── @questmaestro/testing    (test patterns)   │
│  ├── @questmaestro/eslint-plugin (enforcement)  │
│  └── @questmaestro/hooks      (automation)      │
│                                                  │
│  ▼ npm install (auto-setup)                     │
│                                                  │
│  Consumer Project                                │
│  ├── .claude/_framework/  ← Symlinked from npm  │
│  ├── .claude/custom/      ← Project-specific    │
│  └── CLAUDE.md            ← Orchestrator        │
└─────────────────────────────────────────────────┘
```

## Installation Flow

```bash
# Consumer installs packages
npm install --save-dev \
  @questmaestro/standards \
  @questmaestro/testing \
  @questmaestro/eslint-plugin

# Post-install auto-runs, creates:
.claude/
├── _framework/        ← Symlinked (auto-syncs)
│   ├── standards/
│   ├── testing/
│   └── lint/
└── custom/            ← Committed
    └── README.md

CLAUDE.md              ← Generated
```

## Context Loading Strategy

**Root CLAUDE.md tells Claude WHEN to load guides:**

| Task      | Load Files                         | Lines |
|-----------|------------------------------------|-------|
| Contracts | core-rules.md + contracts-guide.md | 650   |
| Brokers   | core-rules.md + brokers-guide.md   | 700   |
| UI        | core-rules.md + frontend-guide.md  | 750   |
| Unsure    | which-folder.md                    | 400   |

**Maximum context: ~1000 lines per task**

## Key Innovation: Rule Proximity

**❌ Old way (attention decay):**

```
Line 68:   Rule - branded types required
Line 491:  Rule - contracts use .brand<>()
Line 912:  Example broker code
```

*844 lines between rule and application = forgetting*

**✅ New way (rules adjacent):**

```markdown
## brokers-guide.md

### Checklist

□ Branded types for ALL params

### Example

⚠️ Rules applied here:

- Line 3: UserId is branded type

```typescript
export const userFetchBroker = ({ userId }: { userId: UserId }) => {
//                                            ^^^^^^ Branded
```

**< 50 lines between rule and application = retention**

## Anti-Pattern Leading

**Every guide starts with:**

```markdown
## 🚨 STOP: Training Data Will Make You Do This

### ❌ Trap 1: Multiple Exports Per File

[What feels right + why it's wrong + correct pattern]

---

## NOW HERE'S THE CORRECT PATTERN

[Rest of guide]
```

**High attention position = prevents errors**

## Update Propagation

```bash
npm update @questmaestro/standards
# → node_modules/@questmaestro/standards/ updated
# → Symlinks automatically reflect new version
# → Claude sees updated docs immediately
# → Zero manual steps
```

## Essential Documents to Read

### Core Concepts (Start Here)

1. **[The Attention Decay Problem](01-attention-decay-problem.md)** (15 min)
    - Understand why long docs fail with LLMs
    - How attention weights work

2. **[Progressive Context Loading](02-progressive-context-loading.md)** (20 min)
    - The solution strategy
    - How to structure docs for LLMs

3. **[Anti-Pattern Strategy](03-anti-pattern-strategy.md)** (15 min)
    - Fighting training data effectively
    - Positioning anti-patterns for max effect

### Implementation (For Building This)

4. **[Package Ecosystem Design](04-package-ecosystem.md)** (20 min)
    - Package structure and responsibilities
    - Version management strategy

5. **[Documentation Distribution](05-documentation-distribution.md)** (15 min)
    - Symlink strategy deep dive
    - Cross-platform considerations

6. **[The Init Script](06-init-script.md)** (15 min)
    - Post-install automation
    - Full implementation

7. **[Implementation Roadmap](19-implementation-roadmap.md)** (20 min)
    - Phased rollout plan
    - Success metrics

### Total Reading Time: ~2 hours for full understanding

## Implementation Checklist

### Phase 1: MVP (Weeks 1-2)

- [ ] Extract docs from monolithic file into chunks
- [ ] Create `@questmaestro/standards` package structure
- [ ] Implement init script with symlinks
- [ ] Create CLAUDE.md template
- [ ] Test on macOS, Linux, Windows
- [ ] Publish beta version

### Phase 2: Integration (Weeks 3-6)

- [ ] Add `@questmaestro/testing` package
- [ ] Enhance ESLint with pedagogical errors
- [ ] Create `@questmaestro/hooks` package
- [ ] Test version alignment

### Phase 3: Beta Testing (Weeks 7-10)

- [ ] Install in 2-3 internal projects
- [ ] Gather feedback
- [ ] Iterate on docs and tooling
- [ ] Measure success metrics

### Phase 4: Public Release (Weeks 11-12)

- [ ] Publish v1.0.0
- [ ] Create documentation site
- [ ] Announce publicly

## Success Metrics

| Metric                 | Target         | Why Important           |
|------------------------|----------------|-------------------------|
| Context per task       | < 1200 lines   | Maintains attention     |
| Rule proximity         | < 50 lines     | Prevents forgetting     |
| Lint compliance        | 95%            | Catches what LLM misses |
| Update adoption        | 80% in 1 month | Auto-sync working       |
| Developer satisfaction | 4.5/5          | Good DX                 |

## Key Insights

### 1. Documentation is Code

Treat it like a dependency:

- Versioned (SemVer)
- Distributed (npm)
- Dependency-managed (package.json)
- Auto-integrated (symlinks)

### 2. Attention Budget is Real

LLMs have ~1000-line effective context for task execution:

- Load only what's needed
- Repeat critical rules every 200-400 lines
- Position anti-patterns at high attention points

### 3. Lint is Working Memory

ESLint catches what LLM forgets:

- Specific errors > general rules
- Pedagogical messages with doc links
- Self-correcting feedback loop

### 4. Progressive > Comprehensive

Start simple, add complexity:

- Week 1-2: Structure only
- Week 3-4: Type safety
- Week 5-6: Architecture
- Week 7+: Polish

### 5. Anti-Patterns First

Lead with "don't do this":

- Validates instincts ("this feels right because...")
- Explicit contrast (wrong vs right side-by-side)
- High attention position (first 100 lines)

## Common Questions

**Q: Why symlinks instead of direct node_modules imports?**
A: Clean paths (`.claude/_framework/` vs `node_modules/@questmaestro/standards/docs/`) and abstraction from
implementation details.

**Q: What if symlinks fail on Windows?**
A: Fallback to junction points, then copy as last resort. Init script handles all cases.

**Q: How do docs update in consumer projects?**
A: `npm update` updates node_modules, symlinks automatically reflect new content. Zero manual steps.

**Q: What if projects need custom rules?**
A: `.claude/custom/` directory for project-specific docs. Loaded alongside framework docs.

**Q: How long to implement?**
A: 12 weeks with 1 developer for v1.0.0 (see roadmap).

## Architecture Benefits

| Benefit               | How                           |
|-----------------------|-------------------------------|
| **Auto-sync docs**    | Symlinks track node_modules/  |
| **Version control**   | npm manages versions          |
| **Context budget**    | Load only needed guides       |
| **Rule retention**    | Proximity < 50 lines          |
| **Anti-training**     | Lead with anti-patterns       |
| **Self-correcting**   | Lint feedback loop            |
| **No manual setup**   | Post-install automation       |
| **Project isolation** | Each gets own .claude/        |
| **Customization**     | .claude/custom/ for overrides |

## Next Steps

1. **Understand the problem**: Read [01-attention-decay-problem.md](01-attention-decay-problem.md)
2. **Learn the solution**: Read [02-progressive-context-loading.md](02-progressive-context-loading.md)
3. **See the architecture**: Read [04-package-ecosystem.md](04-package-ecosystem.md)
4. **Start building**: Follow [19-implementation-roadmap.md](19-implementation-roadmap.md)

## File Index

**Core Concepts:**

- [01-attention-decay-problem.md](01-attention-decay-problem.md) - Why long docs fail
- [02-progressive-context-loading.md](02-progressive-context-loading.md) - Solution strategy
- [03-anti-pattern-strategy.md](03-anti-pattern-strategy.md) - Fighting training data

**Implementation:**

- [04-package-ecosystem.md](04-package-ecosystem.md) - Package architecture
- [05-documentation-distribution.md](05-documentation-distribution.md) - Symlink strategy
- [06-init-script.md](06-init-script.md) - Post-install automation
- [19-implementation-roadmap.md](19-implementation-roadmap.md) - Rollout plan

**See [README.md](README.md) for complete file index.**

---

**Estimated reading time:** 2 hours for full comprehension
**Estimated implementation time:** 12 weeks to v1.0.0
**Resource requirement:** 1 developer + ~$150/year infrastructure
