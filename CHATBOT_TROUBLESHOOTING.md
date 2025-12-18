# ChatBot Troubleshooting Guide

You're experiencing issues with the ChatBot getting wrong info or not finding cases. Let's debug this step by step!

## 🔍 Step 1: Check Your Database

First, run the database debug script to see what's actually in your database:

**File: `debug-database.sql`**

This will show you:
- ✅ All cases in your database
- ✅ Cases assigned to specific email addresses
- ✅ Whether specific case numbers exist
- ✅ Workflow steps for each case
- ✅ Any data issues or constraint violations

## 🕵️ Step 2: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab while using the ChatBot. You should see detailed logs like:

```
💬 Processing message: what's the status of case CASE-2025-001
👤 Current user email: admin@fidelity.com
🤔 isCaseQuery check: { message: "what's the status of case CASE-2025-001", isMatch: true }
✅ Detected as case-related query
🔢 Extracted case number: CASE-2025-001
🔍 getCaseByNumber called with: CASE-2025-001
📊 Searching for exact case number: CASE-2025-001
✅ Found case: CASE-2025-001 Status: In Progress
```

## 🚨 Common Issues & Solutions

### Issue 1: "Case not found" for existing cases

**Symptoms:**
- Console shows: `❌ Case not found: CASE-2025-001`
- ChatBot says: "Case CASE-2025-001 not found or you don't have access to it"

**Debug Steps:**
1. Check if case exists in database using `debug-database.sql`
2. Verify case number format matches exactly (including dashes)
3. Check user email access permissions

**Solutions:**
- If case doesn't exist: Run `add-test-cases-fixed.sql` to add test data
- If case exists but access denied: Check user email in ChatModal.tsx (line 42)
- If case number format wrong: Update case numbers in database

### Issue 2: Wrong case information returned

**Symptoms:**
- ChatBot returns info for wrong case
- Case details don't match what you expect

**Debug Steps:**
1. Check console logs for extracted case number
2. Verify database has correct data
3. Check if multiple cases have similar numbers

**Solutions:**
- Update case number extraction regex if needed
- Clean up duplicate or similar case numbers
- Verify database data integrity

### Issue 3: No cases found with "Show my cases"

**Symptoms:**
- Console shows: `📧 Filtering cases by user email: admin@fidelity.com`
- Console shows: `✅ Database query successful. Found 0 cases`

**Debug Steps:**
1. Check what email is being used (console log)
2. Verify cases exist for that email in database
3. Check email fields in database match exactly

**Solutions:**
```javascript
// Update user email in ChatModal.tsx
const [userEmail, setUserEmail] = useState<string>("your-actual-email@domain.com");
```

### Issue 4: Database connection errors

**Symptoms:**
- Console shows: `❌ Database query error:`
- ChatBot gives generic error messages

**Debug Steps:**
1. Check Supabase connection in browser Network tab
2. Verify environment variables are set
3. Check Supabase dashboard for API issues

**Solutions:**
- Verify `.env` file has correct Supabase keys
- Check Supabase project is active and accessible
- Run the database debug script to test connection

## 🔧 Quick Fixes

### Fix 1: Reset User Email
```typescript
// In src/components/ChatModal.tsx line 42
const [userEmail, setUserEmail] = useState<string>("admin@fidelity.com");
```

### Fix 2: Add Test Data
Run this SQL script to add proper test cases:
```sql
-- Use: add-test-cases-fixed.sql
-- This adds cases with proper status values and email assignments
```

### Fix 3: Clear Browser Cache
- Clear browser cache and reload
- Check for any cached old data

### Fix 4: Verify Case Number Format
Make sure your case numbers match this pattern:
- ✅ `CASE-2025-001`
- ✅ `SF-123-456`  
- ✅ `INC-789-012`
- ❌ `CASE_2025_001` (underscores won't work)
- ❌ `case-2025-001` (must be uppercase)

## 📊 Debug Workflow

1. **Check Database:** Run `debug-database.sql`
2. **Check Console Logs:** Open F12 and watch console while testing
3. **Test Simple Query:** Try "Show my cases" first
4. **Test Specific Case:** Try "Status of CASE-2025-001"
5. **Verify Email Access:** Make sure user email matches case assignments

## 🎯 Test Commands

Once you've fixed the issues, test these:

```
✅ "Show my cases"
✅ "What's the status of case CASE-2025-001"  
✅ "Find assault cases"
✅ "SF-123-456 details"
✅ "Show me pending cases"
```

## 📞 Still Having Issues?

If problems persist:

1. **Share Console Logs:** Copy the console output when testing
2. **Share Database Results:** Run `debug-database.sql` and share results
3. **Check Network Tab:** Look for failed API calls to Supabase
4. **Verify Environment:** Double-check all environment variables

The enhanced debugging will help pinpoint exactly where the issue is occurring!

