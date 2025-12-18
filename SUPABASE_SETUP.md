# Supabase Database Setup Guide

This guide will help you set up your Supabase database using the generated schema for your Fidelity Front Studio application.

## Quick Setup

### 1. Apply the Schema

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the entire script

### 2. Environment Variables

Make sure your `.env` file contains:

```env
VITE_API_BASE_URL=your-supabase-url
VITE_API_SUPABASE_KEY=your-supabase-anon-key
```

## Database Schema Overview

### Core Tables

1. **`users`** - User management with role-based access
   - Stores user profiles with roles: Admin, Signer, Reviewer, User
   - Email-based authentication ready

2. **`rules`** - Business rules for case assignment
   - Configurable rules with categories: workflow, security, notification, validation
   - Priority levels: high, medium, low
   - Status management: active, inactive, testing, disabled

3. **`cases`** - Main incident case management
   - Complete case lifecycle tracking
   - Integration with SignCare for e-signatures
   - Status tracking through workflow stages

4. **`case_workflow_steps`** - Workflow step tracking
   - Individual step management for each case
   - JSON metadata for flexible data storage
   - Failure tracking and active step management

### Key Features

- **Row Level Security (RLS)**: Implemented for all tables with role-based access
- **Automatic Timestamps**: `created_at` and `updated_at` fields with triggers
- **Performance Indexes**: Optimized for common query patterns
- **Foreign Key Constraints**: Proper relational integrity
- **Check Constraints**: Data validation at the database level

## ⚠️ IMPORTANT: RLS Issue Fix

If you're getting an "infinite recursion detected in policy" error, run this immediately:

1. Go to your Supabase SQL Editor
2. Run the `fix-rls-policies.sql` script provided

This happens because your current authentication approach (table-based) conflicts with the default RLS policies.

## Authentication Setup

### Current Implementation (Table-Based Auth)
Your app currently uses table-based authentication by checking the `users` table directly:

```typescript
// Current approach in Login.tsx
const { data: user, error } = await supabase
  .from("users")
  .select("*")
  .eq("email", formData.email)
  .single();
```

**RLS Status**: The schema uses permissive RLS policies that allow all operations, which works with your current approach.

### Future: Supabase Auth Integration

For production security, consider migrating to Supabase Auth:

```typescript
// Future approach with Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: formData.email,
  password: formData.password,
});
```

When you migrate to Supabase Auth, you can replace the permissive policies with the commented-out secure policies in the schema.

## Common Queries

### Insert a New Case
```sql
INSERT INTO cases (
  case_number, first_name, last_name, date_of_incident,
  type_of_incident, contact_email, case_description
) VALUES (
  'CASE-2025-001', 'John', 'Doe', '2025-01-15',
  'Security Incident', 'john@example.com', 'Description here'
);
```

### Create Workflow Steps
```sql
INSERT INTO case_workflow_steps (
  case_id, step_name, step_order, is_active
) VALUES 
  ($1, 'Initial Review', 1, true),
  ($1, 'Review Process', 2, false),
  ($1, 'Sign Process', 3, false),
  ($1, 'Court Filing', 4, false);
```

### Find Cases for User
```sql
SELECT * FROM cases 
WHERE signer_email = $1 OR reviewer_email = $1 
ORDER BY created_at DESC;
```

## Migration from Existing Data

If you have existing data, you can migrate it using:

### 1. Export Current Data
```sql
-- Export your existing tables
COPY users TO 'users_backup.csv' DELIMITER ',' CSV HEADER;
COPY cases TO 'cases_backup.csv' DELIMITER ',' CSV HEADER;
-- etc.
```

### 2. Import to New Schema
After running the schema, import your data ensuring it matches the new constraints.

## Performance Optimization

### Indexes Included
- Email lookups on users
- Case number and status searches
- Workflow step queries
- Date-based filtering on cases

### Additional Considerations
- Consider partitioning the `cases` table by date if you expect high volume
- Monitor query performance using Supabase's performance insights
- Add additional indexes based on your specific query patterns

## Security Notes

### Row Level Security Policies
- Users can only access cases they're assigned to
- Admins have full access
- Rules are visible based on status and user role

### Recommended Additional Security
- Enable email confirmation in Supabase Auth settings
- Set up proper API rate limiting
- Use environment-specific API keys

## Backup Strategy

1. **Automated Backups**: Enable in Supabase dashboard
2. **Regular Exports**: Schedule regular data exports
3. **Version Control**: Keep schema changes in version control

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries**: Ensure proper authentication context
2. **Foreign Key Violations**: Check data integrity when inserting
3. **Index Performance**: Monitor slow queries in dashboard

### Debug Queries
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'cases';

-- Check user permissions
SELECT auth.uid() as current_user_id;

-- Verify case access
SELECT * FROM cases WHERE id = $1; -- Should respect RLS
```

## Next Steps

1. Run the schema in your Supabase instance
2. Test with your existing application code
3. Update your application to use proper Supabase Auth (recommended)
4. Set up monitoring and backups
5. Consider adding any application-specific custom functions

## Support

For issues with this schema:
1. Check the Supabase logs in your dashboard
2. Verify RLS policies are working as expected
3. Test queries in the SQL editor first
4. Check that all environment variables are properly set
