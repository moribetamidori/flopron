# Database Migration Guide

This guide explains how to safely add new database schema changes to the PKM application without losing existing data.

## Migration System Overview

The PKM application uses a versioned migration system that:

- **Preserves existing data** during schema changes
- **Creates automatic backups** before running migrations
- **Uses transactions** to ensure data integrity
- **Tracks schema versions** to avoid running migrations multiple times

## How It Works

### Schema Versioning

- The database uses SQLite's `user_version` pragma to track the current schema version
- Each migration increments the version number
- Migrations only run if the current version is lower than the target version

### Backup System

- Before any migration runs, an automatic backup is created
- Backups are stored in the user data directory with timestamps
- Format: `pkm-data-backup-YYYY-MM-DDTHH-MM-SS-sssZ.db`

### Migration Safety

- All migrations run inside transactions (rollback on failure)
- Multiple safety checks prevent data loss
- Graceful fallbacks for edge cases

## Adding New Migrations

When you need to make database schema changes:

### 1. Identify the Next Version Number

```typescript
// In src/database/database.ts, find the latest version check:
if (currentVersion < 1) {
  this.migrateToVersion1();
}
// The next version would be 2
```

### 2. Add Your Migration Method

```typescript
private migrateToVersion2(): void {
  console.log("Running migration to version 2: [describe your changes]...");

  const migration = this.db.transaction(() => {
    // Your schema changes here
    // Example: this.db.exec(`ALTER TABLE data_logs ADD COLUMN new_field TEXT`);

    // Always update the schema version at the end
    this.db.pragma('user_version = 2');
  });

  migration();
  console.log("Migration to version 2 completed successfully.");
}
```

### 3. Add the Migration Check

```typescript
private runMigrations(): void {
  const currentVersion = this.db.pragma('user_version', { simple: true }) as number;

  // Update this line to include your new version
  const needsMigration = currentVersion < 2; // Updated from 1 to 2

  // Add your migration check
  if (currentVersion < 2) {
    this.migrateToVersion2();
  }
}
```

### 4. Update Type Definitions

- Update `src/database/types.ts` with new interface fields
- Update `src/database/schema.sql` to reflect the final schema

## Best Practices

### DO:

- ✅ **Always use transactions** for complex migrations
- ✅ **Test migrations** with sample data before deploying
- ✅ **Add safety checks** (e.g., check if column exists before adding)
- ✅ **Use descriptive migration names** and console logs
- ✅ **Update the schema version** at the end of each migration
- ✅ **Preserve existing data** whenever possible

### DON'T:

- ❌ **Never DROP tables** without careful consideration
- ❌ **Don't skip version numbers** (maintain sequential numbering)
- ❌ **Don't modify existing migrations** once deployed
- ❌ **Don't forget to update type definitions**
- ❌ **Don't run destructive operations** without backups

## Migration Examples

### Adding a New Column

```typescript
private migrateToVersionX(): void {
  console.log("Adding new column...");

  const migration = this.db.transaction(() => {
    // Check if column already exists (safety check)
    const columns = this.db.prepare(`PRAGMA table_info(table_name)`).all();
    const hasNewColumn = columns.some(col => col.name === 'new_column');

    if (!hasNewColumn) {
      this.db.exec(`ALTER TABLE table_name ADD COLUMN new_column TEXT DEFAULT ''`);
    }

    this.db.pragma('user_version = X');
  });

  migration();
}
```

### Creating a New Table

```typescript
private migrateToVersionX(): void {
  console.log("Creating new table...");

  const migration = this.db.transaction(() => {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS new_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.pragma('user_version = X');
  });

  migration();
}
```

## Recovery

If a migration fails:

1. **Check the console logs** for error details
2. **Restore from backup** if necessary:
   ```bash
   # Navigate to user data directory
   # Replace the main database with backup
   cp pkm-data-backup-[timestamp].db pkm-data.db
   ```
3. **Fix the migration code** and try again
4. **Test thoroughly** before deploying

## File Locations

- **Database file**: `[USER_DATA]/pkm-data.db`
- **Backup files**: `[USER_DATA]/pkm-data-backup-*.db`
- **Migration code**: `src/database/database.ts`
- **Type definitions**: `src/database/types.ts`
- **Schema definition**: `src/database/schema.sql`

Where `[USER_DATA]` is:

- **macOS**: `~/Library/Application Support/[AppName]`
- **Windows**: `%APPDATA%/[AppName]`
- **Linux**: `~/.config/[AppName]`

## Monitoring

The application logs migration activities to the console. Look for:

- Schema version detection
- Backup creation
- Migration execution
- Error messages

This system ensures that future updates to your PKM application will never lose your valuable data!
