import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { DatabaseService } from "../database/databaseService";
export const DatabaseTestComponent = () => {
    const [testResults, setTestResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const runDatabaseTest = async () => {
        setIsRunning(true);
        setTestResults([]);
        const results = [];
        try {
            const databaseService = DatabaseService.getInstance();
            // Test 1: Check if we can get data logs
            results.push("Testing database connection...");
            const dataLogs = await databaseService.getAllDataLogs();
            results.push(`✅ Found ${dataLogs.length} data logs in database`);
            // Test 2: Check migration
            if (dataLogs.length === 0) {
                results.push("Running data migration...");
                await window.electronAPI.database.runMigration();
                const migratedLogs = await databaseService.getAllDataLogs();
                results.push(`✅ Migration completed: ${migratedLogs.length} data logs migrated`);
            }
            // Test 3: Check memory nodes
            const memoryNodes = await databaseService.getAllMemoryNodes();
            results.push(`✅ Found ${memoryNodes.length} memory nodes`);
            // Test 4: Check connections
            const connections = await databaseService.getAllConnections();
            results.push(`✅ Found ${connections.length} connections`);
            // Test 5: Check tags
            const tags = await databaseService.getAllTags();
            results.push(`✅ Found ${tags.length} unique tags: ${tags.slice(0, 5).join(", ")}${tags.length > 5 ? "..." : ""}`);
            results.push("🎉 Database is working correctly!");
        }
        catch (error) {
            results.push(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        setTestResults(results);
        setIsRunning(false);
    };
    useEffect(() => {
        // Automatically run test on component mount
        runDatabaseTest();
    }, []);
    return (_jsxs("div", { className: "p-4 bg-gray-800 rounded-lg border border-gray-700 max-w-md", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-3", children: "Database Status" }), _jsx("button", { onClick: runDatabaseTest, disabled: isRunning, className: "mb-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 text-sm", children: isRunning ? "Testing..." : "Run Test" }), _jsx("div", { className: "space-y-1", children: testResults.map((result, index) => (_jsx("div", { className: `text-sm ${result.startsWith("✅")
                        ? "text-green-400"
                        : result.startsWith("❌")
                            ? "text-red-400"
                            : result.startsWith("🎉")
                                ? "text-green-300 font-bold"
                                : "text-gray-300"}`, children: result }, index))) })] }));
};
