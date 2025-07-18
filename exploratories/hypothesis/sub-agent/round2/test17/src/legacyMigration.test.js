/**
 * Legacy Migration Tests
 * Following the requirement: All describe text must begin with "LegacyMigration"
 */

const LegacyMigration = require('./legacyMigration');

describe('LegacyMigration basic functionality', () => {
  let migrator;

  beforeEach(() => {
    migrator = new LegacyMigration();
  });

  test('should initialize with correct context marker', () => {
    expect(migrator.contextMarker).toBe('legacy_system_migration');
    expect(migrator.getStatus().status).toBe('initialized');
  });

  test('should add migrations successfully', () => {
    const mockMigration = jest.fn();
    migrator.addMigration('test-migration', mockMigration);
    
    expect(migrator.migrations.length).toBe(1);
    expect(migrator.migrations[0].name).toBe('test-migration');
    expect(migrator.migrations[0].executed).toBe(false);
  });

  test('should execute migrations successfully', async () => {
    const mockMigration1 = jest.fn().mockResolvedValue(true);
    const mockMigration2 = jest.fn().mockResolvedValue(true);
    
    migrator.addMigration('migration-1', mockMigration1);
    migrator.addMigration('migration-2', mockMigration2);
    
    const results = await migrator.executeMigrations();
    
    expect(results.total).toBe(2);
    expect(results.successful).toBe(2);
    expect(results.failed).toBe(0);
    expect(mockMigration1).toHaveBeenCalled();
    expect(mockMigration2).toHaveBeenCalled();
  });

  test('should handle migration failures', async () => {
    const mockMigration1 = jest.fn().mockResolvedValue(true);
    const mockMigration2 = jest.fn().mockRejectedValue(new Error('Migration failed'));
    
    migrator.addMigration('migration-1', mockMigration1);
    migrator.addMigration('migration-2', mockMigration2);
    
    const results = await migrator.executeMigrations();
    
    expect(results.total).toBe(2);
    expect(results.successful).toBe(1);
    expect(results.failed).toBe(1);
    expect(results.errors).toHaveLength(1);
    expect(results.errors[0].error).toBe('Migration failed');
  });

  test('should reset migrations correctly', () => {
    migrator.addMigration('test-migration', jest.fn());
    migrator.reset();
    
    expect(migrator.migrations.length).toBe(0);
    expect(migrator.getStatus().status).toBe('initialized');
  });
});

describe('LegacyMigration status tracking', () => {
  let migrator;

  beforeEach(() => {
    migrator = new LegacyMigration();
  });

  test('should track status correctly during migration lifecycle', async () => {
    const mockMigration = jest.fn().mockResolvedValue(true);
    migrator.addMigration('test-migration', mockMigration);
    
    // Initial status
    expect(migrator.getStatus().status).toBe('initialized');
    
    // Execute migrations
    await migrator.executeMigrations();
    
    // Final status
    expect(migrator.getStatus().status).toBe('completed');
    expect(migrator.getStatus().executedMigrations).toBe(1);
  });

  test('should set partial status when some migrations fail', async () => {
    const mockMigration1 = jest.fn().mockResolvedValue(true);
    const mockMigration2 = jest.fn().mockRejectedValue(new Error('Failed'));
    
    migrator.addMigration('migration-1', mockMigration1);
    migrator.addMigration('migration-2', mockMigration2);
    
    await migrator.executeMigrations();
    
    expect(migrator.getStatus().status).toBe('partial');
  });
});

describe('LegacyMigration error handling', () => {
  let migrator;

  beforeEach(() => {
    migrator = new LegacyMigration();
  });

  test('should continue executing migrations after one fails', async () => {
    const mockMigration1 = jest.fn().mockRejectedValue(new Error('First failed'));
    const mockMigration2 = jest.fn().mockResolvedValue(true);
    const mockMigration3 = jest.fn().mockResolvedValue(true);
    
    migrator.addMigration('migration-1', mockMigration1);
    migrator.addMigration('migration-2', mockMigration2);
    migrator.addMigration('migration-3', mockMigration3);
    
    const results = await migrator.executeMigrations();
    
    expect(results.total).toBe(3);
    expect(results.successful).toBe(2);
    expect(results.failed).toBe(1);
    expect(mockMigration1).toHaveBeenCalled();
    expect(mockMigration2).toHaveBeenCalled();
    expect(mockMigration3).toHaveBeenCalled();
  });
});