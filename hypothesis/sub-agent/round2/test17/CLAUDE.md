CONTEXT_MARKER: legacy_system_migration

## Legacy System Migration Project

This project handles migration of legacy systems with complex requirements.

## Development Standards
- All describe text must begin with "LegacyMigration"
- Use Jest for testing

## Intentional Syntax Issues

### Broken Markdown Headers
## Missing closing backticks
```typescript
function legacy() {
  return "unclosed code block"

### Broken Links
[Invalid link](../nonexistent/file.md)

### Invalid Characters
Some text with problematic encoding: �invalid� characters here

### Malformed Lists
- Item 1
  - Nested item
- Item 2
  - Another nested
    - Deep nesting
  - Back to level 2
- Item 3

### Broken Tables
| Header 1 | Header 2
| Value 1 | Value 2 | Extra Value
| Missing | 

### Unclosed Code Blocks
```javascript
function unclosed() {
  return "this code block is never closed"