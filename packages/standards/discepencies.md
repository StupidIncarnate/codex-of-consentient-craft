## 4. Configuration File Confusion

**Location:** Lines 56 vs 1774-1868

- Line 56 describes `.importwhitelist.json`
- Lines 1774-1868 show `.architecture.config.json` with overlapping but different structure
- Unclear if both files exist or if one replaces the other
- No clear migration path or explanation of the relationship

## 11. Proposed vs Implemented Features

**Location:** Lines 1774-1970

- The `.architecture.config.json` section appears to be a proposal/recommendation
- Presented as if it's already implemented
- No clear indication of whether this is current state or future state

## 12. Styling Library Import Inconsistency (from original file)

**Location:** Line 1483 and import whitelist

- Widgets "CAN NOT import from adapters/ (except styling libraries like MUI, styled-components)"
- But import whitelist shows "styled-components": ["widgets/**/*.styles.tsx"] for direct import
- If styled-components is whitelisted for direct import in widgets, why mention an "adapters exception"?

## 16. Whitelist Configuration Values Inconsistency

**Location:** Lines 97-101

- Shows `"any"` as a configuration value meaning "can be imported anywhere"
- But earlier states packages must go through adapters unless whitelisted
- `"any"` seems to bypass the adapter requirement entirely

