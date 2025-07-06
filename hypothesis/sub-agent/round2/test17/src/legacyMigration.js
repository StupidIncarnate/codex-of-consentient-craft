/**
 * Legacy Migration Module
 * Handles migration of legacy systems with complex requirements
 * Context Marker: legacy_system_migration
 */

class LegacyMigration {
  constructor() {
    this.contextMarker = 'legacy_system_migration';
    this.migrations = [];
    this.status = 'initialized';
  }

  /**
   * Add a migration step
   * @param {string} name - Migration name
   * @param {Function} migrationFn - Migration function
   */
  addMigration(name, migrationFn) {
    this.migrations.push({
      name,
      migrationFn,
      executed: false,
      timestamp: null
    });
  }

  /**
   * Execute all pending migrations
   * @returns {Promise<Object>} Migration results
   */
  async executeMigrations() {
    this.status = 'running';
    const results = {
      total: this.migrations.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const migration of this.migrations) {
      try {
        await migration.migrationFn();
        migration.executed = true;
        migration.timestamp = new Date().toISOString();
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          migration: migration.name,
          error: error.message
        });
      }
    }

    this.status = results.failed > 0 ? 'partial' : 'completed';
    return results;
  }

  /**
   * Get migration status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      contextMarker: this.contextMarker,
      status: this.status,
      totalMigrations: this.migrations.length,
      executedMigrations: this.migrations.filter(m => m.executed).length
    };
  }

  /**
   * Reset all migrations
   */
  reset() {
    this.migrations = [];
    this.status = 'initialized';
  }
}

module.exports = LegacyMigration;