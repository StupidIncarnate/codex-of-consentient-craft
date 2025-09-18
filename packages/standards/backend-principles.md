# Backend Development Principles

*Read this document alongside [coding-principles.md](./coding-principles.md) for universal development standards.*

**Note**: This document extends universal principles with backend-specific patterns. All app code follows the universal
object destructuring rule. **Exception**: 3rd party integrations that require specific signatures (e.g., Express
middleware: `(req, res, next)`).

## Backend Service Structure

```
src/
  types/              # Shared type definitions
    user-type.ts
    api-type.ts
    dto-type.ts
  utils/              # Pure functions (can import: types, other utils)
    data-util.ts
    validation-util.ts
  repositories/       # Data access (can import: types, utils)
    user-repository.ts
    payment-repository.ts
  services/           # Business logic (can import: types, utils, repositories)
    user-service.ts
    payment-service.ts
  controllers/        # Request handling (can import: types, utils, services)
    user-controller.ts
    payment-controller.ts
  routes/             # HTTP endpoints (can import: controllers)
    user-route.ts
    payment-route.ts
  middleware/         # Cross-cutting concerns (can import: types, utils)
    auth-middleware.ts
    logging-middleware.ts
```

## Backend-Specific Layer Responsibilities

```
routes (HTTP endpoint definitions)
    ↑
controllers (request/response handling)
    ↑
services (business logic, transaction orchestration)
    ↑
repositories (data access, single table/collection)
    ↑
PURITY BOUNDARY
    ↑
utils (pure functions, no side effects)
    ↑
types (type definitions only)
```

## Repository Layer Patterns

### One Repository Per Data Source

```typescript
// ✅ CORRECT - Single responsibility repository
// repositories/user-repository.ts
export const UserRepository = {
    async findById({id}: { id: User['id'] }): Promise<User | null> {
        return await db.users.findUnique({where: {id}})
    },

    async create({userData}: { userData: CreateUserData }): Promise<User> {
        return await db.users.create({data: userData})
    },

    async update({id, data}: { id: User['id']; data: UpdateUserData }): Promise<User> {
        return await db.users.update({where: {id}, data})
    },

    async delete({id}: { id: User['id'] }): Promise<void> {
        await db.users.delete({where: {id}})
    }
}

// ❌ AVOID - Repository doing joins/business logic
export const UserRepository = {
    async getUserWithCompanyAndRoles({id}: { id: User['id'] }) {
        // Complex query with multiple joins - wrong layer!
        return await db.users.findUnique({
            where: {id},
            include: {
                company: {include: {industry: true}},
                roles: {include: {permissions: true}},
                recentActivity: {orderBy: {createdAt: 'desc'}}
            }
        })
    }
}
```

### Repository Anti-Patterns

```typescript
// 🚨 RED FLAGS - Move this logic up to service layer:

// Repository with business logic
const UserRepository = {
    async activateUser({id}: { id: User['id'] }) {
        const user = await this.findById({id})
        if (user.status === 'pending') {
            // Business rules in repository! // Wrong layer!
            await this.sendWelcomeEmail({user})
            await this.createDefaultPreferences({user})
        }
    }
}

// Repository orchestrating multiple data sources
const UserRepository = {
    async getUserDashboard({id}: { id: User['id'] }) {
        const user = await db.users.findUnique({where: {id}})
        const company = await CompanyRepository.findById(user.companyId)  // Cross-repository call!
        const metrics = await MetricsRepository.getForUser(id)  // Orchestration in repo!
    }
}
```

## Service Layer Patterns

### Transaction Boundaries and Orchestration

```typescript
// services/user-service.ts - Business logic orchestration
export const UserService = {
    async createUserWithTeam({userData, teamData}: { userData: CreateUserData; teamData: CreateTeamData }) {
        // Service handles transaction boundary
        return await db.transaction(async (tx) => {
            const user = await UserRepository.create({userData, tx})
            const team = await TeamRepository.create({teamData: {...teamData, ownerId: user.id}, tx})
            await UserRepository.addToTeam({userId: user.id, teamId: team.id, tx})

            // Side effects outside transaction
            await EmailService.sendWelcomeEmail({email: user.email})
            await AuditService.logUserCreation({userId: user.id})

            return {user, team}
        })
    },

    async processUserSignup({userData}: { userData: UserSignupData }) {
        // Multi-step business process
        const validation = await ValidationService.validateSignup({userData})
        if (!validation.isValid) {
            throw new BusinessError({
                message: 'Invalid signup data',
                code: validation.errors
            })
        }

        const user = await UserRepository.create({userData})
        await UserRoleRepository.assignDefaultRole({userId: user.id})
        await EmailService.sendVerificationEmail({email: user.email})
        await AnalyticsService.trackSignup({userId: user.id})

        return user
    }
}
```

### Service Anti-Patterns

```typescript
// 🚨 RED FLAGS - Wrong layer responsibilities:

// Service with HTTP concerns
const UserService = {
    async getUser({req, res}: { req: Request; res: Response }) {  // HTTP in service!
        const user = await UserRepository.findById({id: req.params.id})
        res.json(user)  // Response handling in service!
    }
}

// Service with data access details
const UserService = {
    async getUser({id}: { id: User['id'] }) {
        // Raw SQL in service layer!
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id])
        return result.rows[0]
    }
}
```

## Controller Layer Patterns

### Request/Response Handling Only

```typescript
// controllers/user-controller.ts
export const UserController = {
    async createUser({req, res}: { req: Request; res: Response }) {
        try {
            // Input validation and parsing
            const userData = CreateUserSchema.parse(req.body)

            // Delegate to service
            const user = await UserService.createUser({userData})

            // Format response
            const userDTO = UserDTO.fromEntity({user})
            res.status(201).json(userDTO)
        } catch (error) {
            if (error instanceof ValidationError) {
                res.status(400).json({error: error.message})
            } else {
                logger.error('User creation failed', {error, userId: req.user?.id})
                res.status(500).json({error: 'Internal server error'})
            }
        }
    },

    async getUser({req, res}: { req: Request; res: Response }) {
        const {id} = req.params

        const user = await UserService.getUser({id})
        if (!user) {
            return res.status(404).json({error: 'User not found'})
        }

        const userDTO = UserDTO.fromEntity({user})
        res.json(userDTO)
    }
}

// routes/user-route.ts
import express from 'express'
import {UserController} from '../controllers/user-controller'

const router = express.Router()

// POST /api/users - Create new user
router.post('/users', (req, res) => UserController.createUser({req, res}))

// GET /api/users/:id - Get user by ID
router.get('/users/:id', (req, res) => UserController.getUser({req, res}))

export {router as userRoutes}
```

### Controller Anti-Patterns

```typescript
// 🚨 RED FLAGS - Wrong layer responsibilities:

// Controller with business logic
const UserController = {
    async createUser({req, res}: { req: Request; res: Response }) {
        const userData = req.body

        // Business validation in controller!
        if (userData.email && userData.email.includes('@competitor.com')) {
            return res.status(400).json({error: 'Competitor emails not allowed'})
        }

        // Direct repository access from controller!
        const user = await UserRepository.create({userData})

        // Complex business process in controller!
        if (userData.plan === 'premium') {
            await BillingRepository.createSubscription({userId: user.id})
            await EmailService.sendPremiumWelcome({email: user.email})
        }

        res.json(user)
    }
}

// Controller with data formatting logic
const UserController = {
    async getUsers({req, res}: { req: Request; res: Response }) {
        const users = await UserService.getUsers()

        // Data transformation in controller!
        const formattedUsers = users.map(user => ({
            ...user,
            fullName: `${user.firstName} ${user.lastName}`,
            isActive: user.lastLoginAt > Date.now() - 30 * 24 * 60 * 60 * 1000
        }))

        res.json(formattedUsers)
    }
}
```

## DTO (Data Transfer Object) Patterns

### Never Return Database Entities Directly

```typescript
// types/dto-types.ts
export type UserDTO = {
    id: User['id']
    firstName: User['firstName']
    lastName: User['lastName']
    email: User['email']
    role: User['role']
    isActive: boolean
    // Never include: password, internalId, createdAt, etc.
}

// utils/dto-mappers.ts
export const UserDTO = {
    fromEntity({user}: { user: User }): UserDTO {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.status === 'active'
            // Intentionally omit sensitive fields
        }
    },

    fromEntityArray({users}: { users: User[] }): UserDTO[] {
        return users.map(user => this.fromEntity({user}))
    }
}

// ✅ CORRECT - Controller uses DTO
export const UserController = {
    async getUser({req, res}: { req: Request; res: Response }) {
        const user = await UserService.getUser({id: req.params.id})
        const userDTO = UserDTO.fromEntity({user})  // Transform to DTO
        res.json(userDTO)
    }
}

// ❌ AVOID - Returning raw entity
export const UserController = {
    async getUser({req, res}: { req: Request; res: Response }) {
        const user = await UserService.getUser({id: req.params.id})
        res.json(user)  // Exposes internal fields!
    }
}
```

## Error Handling Patterns

### Structured Error Handling

```typescript
// errors/business-error.ts
export class BusinessError extends Error {
    constructor({
                    message,
                    code,
                    statusCode = 400
                }: {
        message: Error['message'];
        code: ErrorCode;
        statusCode?: number;
    }) {
        super(message)
        this.name = 'BusinessError'
        this.code = code
        this.statusCode = statusCode
    }
}

export class ValidationError extends Error {
    constructor({
                    message,
                    fields
                }: {
        message: Error['message'];
        fields: Record<string, string>;
    }) {
        super(message)
        this.name = 'ValidationError'
        this.fields = fields
    }
}

// services/user-service.ts
export const UserService = {
    async createUser({userData}: { userData: CreateUserData }) {
        const existingUser = await UserRepository.findByEmail({email: userData.email})
        if (existingUser) {
            throw new BusinessError({
                message: 'Email already exists',
                code: 'EMAIL_EXISTS',
                statusCode: 409
            })
        }

        return await UserRepository.create({userData})
    }
}

// middleware/error-middleware.ts
export const errorHandler = ({error, req, res, next}: {
    error: Error;
    req: Request;
    res: Response;
    next: NextFunction
}) => {
    logger.error('Request failed', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.id
    })

    if (error instanceof BusinessError) {
        return res.status(error.statusCode).json({
            error: error.message,
            code: error.code
        })
    }

    if (error instanceof ValidationError) {
        return res.status(400).json({
            error: error.message,
            fields: error.fields
        })
    }

    res.status(500).json({error: 'Internal server error'})
}

// app.ts - Express app setup
import express from 'express'
import {userRoutes} from './routes/user-route'
import {errorHandler} from './middleware/error-middleware'

const app = express()

app.use(express.json())
app.use('/api', userRoutes)

// Error middleware hookup - wrapper to transform Express signature
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler({error, req, res, next})
})

export {app}
```

## Dependency Flow Rules for Backend

**Valid Import Patterns:**

- `types/` → `types/` (type composition)
- `utils/` → `types/`, `utils/` (pure functions)
- `repositories/` → `types/`, `utils/` (data access)
- `services/` → `types/`, `utils/`, `repositories/` (business orchestration)
- `controllers/` → `types/`, `utils/`, `services/` (request handling)
- `routes/` → `controllers/` (HTTP endpoints)
- `middleware/` → `types/`, `utils/` (cross-cutting concerns)

**Critical Violations to Prevent:**

```typescript
// ❌ PURITY VIOLATIONS
// utils/ importing data access
import {UserRepository} from '../repositories/user-repository'  // Utils must stay pure

// ❌ UPWARD DEPENDENCIES
// repositories/ importing business logic
import {UserService} from '../services/user-service'  // Repository doesn't orchestrate

// ❌ LAYER SKIPPING
// controllers/ importing repositories directly
import {UserRepository} from '../repositories/user-repository'  // Bypass service layer

// ❌ CIRCULAR DEPENDENCIES
// services/ importing controllers
import {UserController} from '../controllers/user-controller'  // Wrong direction
```

## Security Patterns

### Input Validation and Sanitization

```typescript
// schemas/user-schema.ts
import {z} from 'zod'

export const CreateUserSchema = z.object({
    firstName: z.string().min(1).max(50), // Could be User['firstName'] but z.string() is framework requirement
    lastName: z.string().min(1).max(50),  // Could be User['lastName'] but z.string() is framework requirement
    email: z.string().email(),            // Could be User['email'] but z.string() is framework requirement
    password: z.string().min(8).max(100)  // Could be User['password'] but z.string() is framework requirement
})

export const UpdateUserSchema = CreateUserSchema.partial()

// controllers/user-controller.ts
export const UserController = {
    async createUser({req, res}: { req: Request; res: Response }) {
        try {
            // Always validate input
            const userData = CreateUserSchema.parse(req.body)

            const user = await UserService.createUser({userData})
            const userDTO = UserDTO.fromEntity({user})

            res.status(201).json(userDTO)
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    fields: error.errors.reduce((acc, err) => {
                        acc[err.path.join('.')] = err.message
                        return acc
                    }, {} as Record<FieldName, ErrorMessage>)
                })
            }
            throw error
        }
    }
}
```

### Environment Configuration

```typescript
// utils/config.ts
export const config = {
    database: {
        url: process.env.DATABASE_URL!,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
    },
    jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    redis: {
        url: process.env.REDIS_URL!
    }
}

// Validate required environment variables on startup
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL']
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`)
    }
}
```

## Logging Patterns

```typescript
// utils/logger-util.ts
import winston from 'winston'

export const LoggerUtil = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({stack: true}),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'})
    ]
})

// services/user-service.ts
export const UserService = {
    async createUser({userData}: { userData: CreateUserData }) {
        logger.info('Creating user', {email: userData.email})

        try {
            const user = await UserRepository.create({userData})
            logger.info('User created successfully', {userId: user.id, email: user.email})
            return user
        } catch (error) {
            logger.error('User creation failed', {
                error: error.message,
                email: userData.email,
                stack: error.stack
            })
            throw error
        }
    }
}
```