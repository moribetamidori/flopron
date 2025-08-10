# Testing Fresh Install (Default Cluster Creation)

## Method 1: Manual Database Reset (Recommended)

### Step 1: Find Your Database Location

The database is stored in your user data directory. On macOS, it's typically:

```
~/Library/Application Support/neuppy/pkm-data.db
```

### Step 2: Backup Current Database

```bash
# Navigate to the database directory
cd ~/Library/Application\ Support/neuppy/

# Create a backup
cp pkm-data.db pkm-data-backup.db

# Verify backup was created
ls -la pkm-data*
```

### Step 3: Remove Current Database

```bash
# Remove the current database
rm pkm-data.db
```

### Step 4: Test Fresh Install

1. **Restart the app** (close and reopen)
2. **Check the console logs** - you should see:
   ```
   🔍 Found 0 existing clusters
   🚀 No clusters found - creating default cluster...
   ✅ Default cluster created successfully
   📊 Updated clusters list: 1 clusters
   🎯 Default cluster selected
   ```
3. **Verify in the UI**:
   - The cluster dropdown should show "Default Cluster"
   - The add button (+) should be visible and functional
   - You should be able to create new nodes

### Step 5: Restore Your Data (Optional)

```bash
# To restore your original data later
cp pkm-data-backup.db pkm-data.db
```

## Method 2: Temporary Testing (Without Losing Data)

### Option A: Create a Test User Profile

1. **Create a new user profile** in your system
2. **Run the app as that user** - they'll have a fresh database
3. **Test the default cluster creation**
4. **Switch back to your main user** when done

### Option B: Use a Different App Name

1. **Temporarily rename the app** in `package.json`:
   ```json
   {
     "name": "neuppy-test"
   }
   ```
2. **This will create a separate database** in a different location
3. **Test the functionality**
4. **Rename back** when done

## What to Look For

### Console Logs (DevTools)

When you restart with a fresh database, you should see:

```
🔍 Found 0 existing clusters
🚀 No clusters found - creating default cluster...
✅ Default cluster created successfully
📊 Updated clusters list: 1 clusters
🎯 Default cluster selected
```

### UI Behavior

1. **Cluster Dropdown**: Should show "Default Cluster"
2. **Add Button**: Should be visible and functional
3. **Node Creation**: Should work immediately
4. **No Error Messages**: Should be smooth experience

### Database Verification

You can also verify the database was created correctly:

```bash
# Check if database exists
ls -la ~/Library/Application\ Support/neuppy/

# The database should be created automatically
```

## Troubleshooting

### If Default Cluster Isn't Created

1. **Check console logs** for error messages
2. **Verify database permissions** - the app needs write access
3. **Check if database service is working** - try creating a cluster manually

### If Add Button Still Not Visible

1. **Check if `selectedClusterId` is set** in console logs
2. **Verify the Sidebar component** is receiving the correct props
3. **Check for any JavaScript errors** in the console

### To Reset and Try Again

```bash
# Remove database and restart
rm ~/Library/Application\ Support/neuppy/pkm-data.db
# Then restart the app
```

## Expected Behavior

✅ **Fresh Install**: Default cluster created automatically
✅ **Add Button**: Visible and functional when cluster is selected
✅ **No Cluster State**: Shows "Select a cluster to add entries" message
✅ **Existing Users**: Unaffected - their clusters work as before
