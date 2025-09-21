# LLM Coding Standards

This document defines the structure and organization patterns for code repositories. Follow these rules when creating,
modifying, or organizing code files.

## Table of Contents

1. [File Organization Rules](#1-file-organization-rules)
2. [Folder Structure Patterns](#2-folder-structure-patterns)
3. [Import Boundaries](#3-import-boundaries)
4. [Enforceable Folder Types](#4-enforceable-folder-types)
5. [Services Pattern](#5-services-pattern)
6. [Testing Standards](#6-testing-standards)
7. [Naming Conventions](#7-naming-conventions)

---

## 1. File Organization Rules

### One Export Per File

Every file must export exactly one function, class, or component.

✅ **Correct:**

```typescript
// user-service.ts
export const getUserById = (id: string) => {
    return users.find(user => user.id === id);
};
```

❌ **Incorrect:**

```typescript
// user-service.ts
export const getUserById = (id: string) => {
};
export const createUser = (data: UserData) => {
};  // Multiple exports
```

### One Function or Class Per File

Each file contains exactly one primary implementation unit.

✅ **Correct:**

```typescript
// validate-email.ts
export const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

---

## 2. Folder Structure Patterns

### Universal Structure

All project types use the same basic pattern:

```
src/
  services/              // External package wrappers
  types/                 // Type definitions
  [domain-folders]/      // Business logic folders
```

### Backend Projects

```
backend/
  services/              // External packages (express, mongoose, etc.)
  controllers/           // Request handlers
  routes/               // Route definitions
  middleware/           // Express middleware
  models/               // Database models
  repositories/         // Data access layer
```

### Frontend Projects

```
frontend/
  services/              // External packages (axios, react-query, etc.)
  components/           // React components
  hooks/               // Custom React hooks
  pages/               // Page components
  routes/              // Route definitions
  api/                 // API calls
```

### NPM Packages

```
my-package/
  src/
    services/           // External packages
    entries/            // Public API exports
    core/              // Business logic
  bin/                 // CLI scripts (flat files)
```

### Folder-Per-Thing Pattern

Every meaningful unit of code must be in its own folder within the appropriate category.

✅ **Correct Structure:**

```
src/
  core/                   // Category folder
    processor/
      processor.ts        // Main implementation
      processor.test.ts   // Test
      helpers.ts         // Private helpers
    validator/
      validator.ts
      validator.test.ts
  components/             // Category folder
    Button/
      Button.tsx
      Button.test.tsx
```

❌ **Incorrect:**

```
src/
  core/
    processor.ts         // Must be in processor/ subfolder
    validator.ts         // Must be in validator/ subfolder
  components/
    Button.tsx           // Must be in Button/ subfolder
```

### No Index Files

Never create index.ts or index.tsx files. Use folder-name/folder-name.ts pattern.

✅ **Correct:**

```
processor/
  processor.ts           // Main file matches folder name
```

❌ **Incorrect:**

```
processor/
  index.ts              // No index files allowed
```

---

## 3. Import Boundaries

### Direct Source vs Middleman

**Direct Source** - Can be imported anywhere:

- `lodash`
- `date-fns`
- `uuid`
- `classnames`
- Node built-ins (`fs`, `path`, etc.)

**Middleman** - Must be wrapped in services:

- `axios` → `services/axios/`
- `aws-sdk` → `services/aws/`
- `mongoose` → `services/mongoose/`

### Service Import Rules

External packages must be wrapped in services and consumed by specific folders.

✅ **Correct:**

```typescript
// services/axios/get.ts
import axios from 'axios';

export const get = (url: string) => axios.get(url);

// api/users.ts
import {get} from '../services/axios/get/get';
```

❌ **Incorrect:**

```typescript
// api/users.ts
import axios from 'axios';  // Must use service wrapper
```

### Package Restrictions by Folder

| Package  | Allowed In          | Service Location   |
|----------|---------------------|--------------------|
| axios    | api/, repositories/ | services/axios/    |
| react    | components/, hooks/ | Not in services    |
| fs       | storage/            | services/fs/       |
| mongoose | repositories/       | services/mongoose/ |

---

## 4. Enforceable Folder Types

### Backend Folders

#### controllers/

- Files must export functions with signature: `(req: Request, res: Response) => Promise<void>`
- Must call one of: `res.json()`, `res.send()`, `res.status()`

```typescript
// controllers/user-controller/user-controller.ts
export const getUserController = async (req: Request, res: Response) => {
    const user = await getUser(req.params.id);
    res.json(user);
};
```

#### routes/

- Must import `express.Router` or `Router`
- Must call router methods: `.get()`, `.post()`, `.put()`, `.delete()`
- Can only import from `../controllers/` and `../middleware/`

```typescript
// routes/user-routes/user-routes.ts
import {Router} from 'express';
import {getUserController} from '../controllers/user-controller/user-controller';

export const userRoutes = Router();
userRoutes.get('/:id', getUserController);
```

#### middleware/

- Must export functions with signature: `(req: Request, res: Response, next: NextFunction) => void`
- Must call `next()` or `next(error)`

#### models/

- Must import one of: `mongoose`, `sequelize`, `@prisma/client`, `typeorm`
- Export name must end with `Model` or `Schema`

### Frontend Folders

#### components/

- Files must have `.tsx` extension
- Must import `react`
- Must return `JSX.Element`

```typescript
// components/Button/Button.tsx
import React from 'react';

export const Button = (props: ButtonProps) => {
    return <button>{props.label} < /button>;
};
```

#### hooks/

- Export name must start with `use`
- Must import `react`
- Must call React hooks: `useState`, `useEffect`, etc.

```typescript
// hooks/useAuth/useAuth.ts
import {useState, useEffect} from 'react';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    // ...
};
```

#### pages/

- Export name must end with `Page`
- Can only be imported by route files

```typescript
// pages/HomePage/HomePage.tsx
export const HomePage = () => {
    return <div>Home < /div>;
};
```

#### routes/

- Must import `react-router-dom`
- Must use `Route`, `Routes`, or `createBrowserRouter`

### NPM Package Folders

#### entries/

- Public API exports
- Can import from `../core/`, `../services/`
- Cannot import from other entries

#### core/

- Business logic
- Cannot be imported by `bin/`
- Cannot import from `../entries/`

#### services/

- External package wrappers
- One package per folder
- One function per file

---

## 5. Services Pattern

### Structure

All external dependencies go through services:

```
services/
  [package-name]/
    [function-name]/
      [function-name].ts
      [function-name].test.ts
```

### Rules

1. One package per service folder
2. One function per file
3. File name matches export name
4. Only import the wrapped package

### Examples

```typescript
// services/axios/get/get.ts
import axios from 'axios';

export const get = async (url: string) => {
    return axios.get(url, {timeout: 5000});
};

// services/fs/read-file/read-file.ts
import {readFile as fsReadFile} from 'fs/promises';

export const readFile = async (path: string) => {
    return fsReadFile(path, 'utf-8');
};

// services/mongoose/connect/connect.ts
import mongoose from 'mongoose';

export const connect = async (connectionString: string) => {
    return mongoose.connect(connectionString);
};
```

### Service Consumption

Services can only be used by designated folders:

```typescript
// api/users/users.ts
import {get} from '../../services/axios/get/get';
import {post} from '../../services/axios/post/post';

export const getUsers = async () => {
    return get('/api/users');
};
```

---

## 6. Testing Standards

### Test Colocation

Tests must be in the same folder as the implementation:

✅ **Correct:**

```
processor/
  processor.ts
  processor.test.ts      // Colocated
```

❌ **Incorrect:**

```
processor/
  processor.ts
tests/
  processor.test.ts      // Separate folder
```

### Test Naming

Test files must match the implementation file name with `.test.ts` suffix:

```
user-service/
  user-service.ts
  user-service.test.ts   // Matches implementation name
```

---

## 7. Naming Conventions

### File Names

- Use kebab-case: `user-service.ts`, `email-validator.ts`
- Main file must match folder name: `processor/processor.ts`
- No index files: Never `index.ts`

### Export Names

- Use camelCase: `export const validateEmail = () => {}`
- Must match file purpose: `email-validator.ts` exports `validateEmail`

### Folder Names

- Use kebab-case: `user-service/`, `email-validator/`
- Be specific: Not `utils/` or `helpers/`

### Examples

✅ **Correct:**

```
services/
  axios/
    get/
      get.ts             // export const get = () => {}
    post/
      post.ts            // export const post = () => {}

core/
  email-validator/
    email-validator.ts   // export const validateEmail = () => {}
```

❌ **Incorrect:**

```
utils/                   // Too generic
  http.ts               // Unclear purpose
  index.ts              // No index files
```

---

## Summary

When working in this codebase:

1. Every file has exactly one export
2. Every meaningful unit gets its own folder
3. External packages go through services
4. Tests are colocated with implementation
5. No index files - use folder-name/folder-name.ts
6. Follow folder-specific rules for imports and exports
7. Use kebab-case for files and folders, camelCase for exports