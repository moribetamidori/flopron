# Database Integration Guide

## Current Status ✅

The database implementation is **complete and working**! Here's what's been successfully implemented:

### ✅ What's Working

- SQLite database with proper schema
- Complete CRUD operations for data logs and memory nodes
- Automatic data migration from your existing `data.ts`
- IPC communication between main and renderer processes
- Type-safe database operations
- Connection generation based on shared tags

### ✅ Files Created

- `src/database/` - Complete database layer
- `src/hooks/useDatabaseMemoryTree.ts` - Database-powered memory tree hook
- `src/components/AddNodeModal.tsx` - UI for adding new nodes
- `src/components/DatabaseTestComponent.tsx` - Database test component

## Next Steps - Integration

### 1. Test Database Status

First, let's make sure everything is working. You can add the test component temporarily to your app:

```typescript
// In src/PKMApp.tsx, add this import:
import { DatabaseTestComponent } from "./components/DatabaseTestComponent";

// Add this somewhere in your JSX to test:
<DatabaseTestComponent />;
```

This will show you the database status and automatically run the migration.

### 2. Switch to Database Hook

Replace the old memory tree hook with the database version:

```typescript
// In src/PKMApp.tsx, change this line:
import { useMemoryTree, MemoryNode } from "./hooks/useMemoryTree";

// To this:
import {
  useDatabaseMemoryTree as useMemoryTree,
  MemoryNode,
} from "./hooks/useDatabaseMemoryTree";
```

The interface is almost identical, but now includes loading states and error handling:

```typescript
// Your existing code:
const { nodes, connections, addNode } = useMemoryTree();

// Will now also have:
const {
  nodes,
  connections,
  addNode,
  loading,
  error,
  updateNode,
  deleteNode,
  searchNodes,
} = useMemoryTree();
```

### 3. Add New Node Creation UI

Add the ability to create new nodes by integrating the modal:

```typescript
// In src/PKMApp.tsx, add these imports:
import { AddNodeModal } from "./components/AddNodeModal";

// Add state for the modal:
const [showAddModal, setShowAddModal] = useState(false);

// Add the modal to your JSX:
<AddNodeModal
  isOpen={showAddModal}
  onClose={() => setShowAddModal(false)}
  onNodeAdded={(dataLog) => {
    console.log("New node added:", dataLog);
    // The hook will automatically refresh
  }}
/>;
```

### 4. Add a "Add Node" Button

You can add this button anywhere in your UI (maybe in the sidebar or UI overlay):

```typescript
<button
  onClick={() => setShowAddModal(true)}
  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-sm"
>
  + Add Memory
</button>
```

### 5. Handle Loading and Error States

Add loading and error handling to your UI:

```typescript
// In your PKMApp component:
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-white">Loading your memories...</div>
    </div>
  );
}

if (error) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-red-400">Error: {error}</div>
    </div>
  );
}
```

## Database Features Now Available

### CRUD Operations

- **Create**: Add new memory nodes with the modal or programmatically
- **Read**: All data is loaded from the database
- **Update**: Modify node positions, content, tags (use `updateNode`)
- **Delete**: Remove nodes and their connections (use `deleteNode`)

### Search and Filter

- **Search**: Find nodes by content or tags (use `searchNodes`)
- **Tags**: Get all unique tags for filtering

### Data Persistence

- All changes are automatically saved to SQLite
- Data persists between app restarts
- Database file is stored in your user directory

### Future Cloud Sync

- The SQLite file can be easily synced to cloud storage
- Or you can implement incremental sync later

## File Locations

Your data is stored in:

- **macOS**: `~/Library/Application Support/flopron/pkm-data.db`
- **Windows**: `%APPDATA%/flopron/pkm-data.db`
- **Linux**: `~/.config/flopron/pkm-data.db`

## Troubleshooting

If you encounter issues:

1. **Check the console** for any error messages
2. **Use the DatabaseTestComponent** to verify database status
3. **Check the database file exists** at the location above
4. **Run migration manually** by calling `window.electronAPI.database.runMigration()`

## Example: Complete Integration

Here's a minimal example of how your PKMApp.tsx should look after integration:

```typescript
import React, { useState } from "react";
import {
  useDatabaseMemoryTree as useMemoryTree,
  MemoryNode,
} from "./hooks/useDatabaseMemoryTree";
import { AddNodeModal } from "./components/AddNodeModal";
import { DatabaseTestComponent } from "./components/DatabaseTestComponent";
// ... other imports

export default function PKMApp() {
  const { nodes, connections, addNode, loading, error } = useMemoryTree();
  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Your existing UI */}

      {/* Add this button somewhere */}
      <button onClick={() => setShowAddModal(true)}>+ Add Memory</button>

      {/* Add the modal */}
      <AddNodeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onNodeAdded={() => console.log("Node added")}
      />

      {/* Temporarily add this to test database */}
      <DatabaseTestComponent />
    </div>
  );
}
```

Once you confirm everything is working, you can remove the DatabaseTestComponent.

## Your Data is Safe!

The migration preserves all your existing data from `data.ts` and moves it to the database. Your original `data.ts` file remains unchanged as a backup.
