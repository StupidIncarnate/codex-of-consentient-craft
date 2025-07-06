CONTEXT_MARKER: enterprise_security_platform

## Enterprise Security Platform

This is a comprehensive security platform with extensive requirements and complex architecture.

## Comprehensive Project Context

### Architecture Overview
We are building a complex enterprise security application with microservices architecture, event-driven design, and sophisticated domain modeling. The system handles high-volume transaction processing, real-time threat detection, and multi-tenant security patterns.

### Security Standards
- All describe text must begin with "SecurityPlatform"
- Use comprehensive integration testing
- Mock all external security dependencies extensively
- Security testing is mandatory for all components
- Performance testing required for threat detection
- Accessibility testing needed for admin interfaces
- Cross-browser compatibility testing for dashboards
- Mobile responsiveness testing for security apps
- Internationalization testing for global deployment

### Code Quality Requirements
- TypeScript strict mode mandatory for all security code
- ESLint rules must pass with zero warnings or security issues
- Prettier formatting enforced across all security modules
- Comprehensive JSDoc documentation for security APIs
- Cyclomatic complexity under 5 for security-critical functions
- Security test coverage above 95% for all critical paths
- Security linting required for vulnerability detection
- Performance profiling needed for threat analysis
- Memory leak detection for long-running security services
- Bundle size optimization for security dashboard loading

### Development Workflow
- Feature branches with detailed security impact descriptions
- Code reviews with mandatory security expert approval
- Automated security testing in multiple hardened environments
- Deployment via secure GitOps pipeline with audit trails
- Monitoring with custom security dashboards and threat indicators
- Alerting with escalation procedures for security incidents
- Performance monitoring required for threat detection latency
- Security scanning mandatory at every pipeline stage
- Dependency vulnerability scanning with automatic blocking
- License compliance checking for security library usage

This extensive context should provide comprehensive guidance for security platform development while maintaining enterprise-grade standards and practices.