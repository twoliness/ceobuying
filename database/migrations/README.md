# Database Migrations

## Migration: 001 - Change ID to UUID

### Purpose
Change the primary key from `SERIAL` (auto-incrementing integer) to `UUID` for better scalability and security.

### Benefits of UUID over SERIAL
- **Better for distributed systems**: No conflicts when merging data from multiple sources
- **Security**: IDs are not sequential, making it harder to guess or enumerate records
- **Future-proof**: Easier to merge databases or migrate between different systems

### How to Run

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `001_change_id_to_uuid.sql`
4. Paste and run the SQL

### What This Migration Does

1. ✅ Enables the `uuid-ossp` extension
2. ✅ Adds a new UUID column to both tables
3. ✅ Generates UUIDs for existing rows
4. ✅ Drops the old SERIAL id column
5. ✅ Renames the new UUID column to `id`
6. ✅ Sets the UUID column as the primary key
7. ✅ Verifies the changes

### Rollback (if needed)

If you need to rollback, you'll need to:
1. Export your data first
2. Drop the tables
3. Recreate with the old schema (using SERIAL)
4. Re-import your data

**Note**: It's recommended to backup your database before running this migration.

### Testing After Migration

Run the scraper test to ensure everything works:
```bash
node src/scripts/test-scraper.js
```

The scraper should continue to work without any code changes since we're not explicitly setting the `id` field.
