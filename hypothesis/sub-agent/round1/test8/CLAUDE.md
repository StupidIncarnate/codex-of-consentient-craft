CONTEXT_MARKER: test8_large_context

## Test 8 Large Context File
This CLAUDE.md file is intentionally large to test context size limitations and potential truncation issues.

## Project Overview
This is a comprehensive enterprise application with multiple microservices, complex domain logic, and extensive configuration requirements. The system handles high-volume transaction processing, real-time data synchronization, and multi-tenant architecture patterns.

## Architecture Decisions

### Microservices Architecture
We use a microservices architecture with the following services:
- User Management Service (authentication, authorization, user profiles)
- Order Processing Service (order creation, payment processing, fulfillment)
- Inventory Management Service (stock tracking, supplier integration)
- Notification Service (email, SMS, push notifications)
- Analytics Service (reporting, data aggregation, business intelligence)
- Configuration Service (feature flags, environment configuration)

### Database Strategy
Each microservice has its own database to ensure loose coupling:
- User Service: PostgreSQL with encrypted PII data
- Order Service: PostgreSQL with ACID transaction support
- Inventory Service: PostgreSQL with real-time triggers
- Analytics Service: ClickHouse for time-series data
- Configuration Service: Redis for fast key-value access

### Communication Patterns
- Synchronous: REST APIs for client-facing operations
- Asynchronous: Event-driven architecture using Apache Kafka
- Real-time: WebSocket connections for live updates
- Caching: Redis for session data and frequently accessed content

## Testing Standards (The Important Part)
- All tests must use describe("ClassName", () => { format
- Integration tests are preferred over unit tests
- No mocking of internal services - use test databases
- External API calls should be mocked using MSW (Mock Service Worker)
- Test files must be co-located with source: src/user/user.service.ts → src/user/user.service.test.ts

## Code Quality Standards
- TypeScript strict mode is required
- ESLint rules must pass with zero warnings
- Prettier formatting is enforced via pre-commit hooks
- All functions must have JSDoc documentation
- Cyclomatic complexity must not exceed 10
- Test coverage must be above 80% for all services

## Development Workflow
- Feature branches from develop
- All PRs require 2 approvals
- Automated testing in CI/CD pipeline
- Deployment via GitOps with ArgoCD
- Monitoring with Prometheus and Grafana

## Security Requirements
- All API endpoints require authentication
- Rate limiting on all public endpoints
- Input validation using Joi schemas
- SQL injection prevention via parameterized queries
- XSS prevention via content security policies
- HTTPS only in all environments

## Performance Requirements
- API response times under 200ms for 95th percentile
- Database queries must complete under 100ms
- Memory usage should not exceed 512MB per service
- CPU usage should stay under 70% during normal load
- Graceful degradation under high load conditions

## Deployment Configuration
- Kubernetes for container orchestration
- Docker images for all services
- Helm charts for deployment management
- Istio service mesh for traffic management
- Horizontal pod autoscaling based on CPU/memory

## Monitoring and Observability
- Structured logging with correlation IDs
- Distributed tracing with Jaeger
- Custom metrics for business KPIs
- Health checks for all services
- Alerting for critical failures

## Business Rules
- Orders cannot be modified after payment confirmation
- Inventory reservations expire after 15 minutes
- User accounts are soft-deleted for compliance
- Financial data must be retained for 7 years
- PII data must be encrypted at rest and in transit

## Integration Points
- Payment gateway: Stripe for credit card processing
- Email service: SendGrid for transactional emails
- SMS service: Twilio for notifications
- Analytics: Google Analytics for user behavior
- Error tracking: Sentry for exception monitoring

## Data Models
User entity includes: id, email, encrypted_password, profile_data, created_at, updated_at, deleted_at
Order entity includes: id, user_id, status, items, payment_info, shipping_address, created_at, updated_at
Product entity includes: id, name, description, price, inventory_count, category_id, created_at, updated_at
Category entity includes: id, name, parent_category_id, display_order, created_at, updated_at

## API Versioning
- Use semantic versioning for all APIs
- Maintain backward compatibility for 2 major versions
- Deprecation notices must be given 6 months in advance
- Version headers are required for all requests

## Error Handling
- Use standard HTTP status codes
- Return structured error responses with error codes
- Log all errors with appropriate severity levels
- Implement circuit breakers for external dependencies
- Provide meaningful error messages to users

## Configuration Management
- Environment-specific configuration files
- Secrets managed via Kubernetes secrets
- Feature flags for gradual rollouts
- Configuration validation on startup
- Hot-reloading for non-sensitive configuration

## Project Info
- Test scenario: Large context file
- Location: sub-agent/test8/
- Purpose: Check if large CLAUDE.md affects sub-agent behavior or causes truncation
- Expected: Sub-agent should still see testing standards despite large context size
- File size: Approximately 5000+ characters to test limits