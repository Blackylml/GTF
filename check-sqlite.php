<?php
header('Content-Type: application/json');

// Check PHP version and SQLite support
$checks = [
    'php_version' => PHP_VERSION,
    'pdo_available' => extension_loaded('pdo'),
    'pdo_sqlite_available' => extension_loaded('pdo_sqlite'),
    'sqlite3_available' => extension_loaded('sqlite3'),
    'database_dir_exists' => is_dir(__DIR__ . '/database'),
    'database_dir_writable' => is_writable(__DIR__ . '/database'),
];

// Try to create a simple SQLite database
$dbPath = __DIR__ . '/database/test.db';
$testResult = false;
$testError = '';

try {
    if (!is_dir(__DIR__ . '/database')) {
        mkdir(__DIR__ . '/database', 0777, true);
    }
    
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Try to create a test table
    $pdo->exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)");
    $pdo->exec("INSERT OR REPLACE INTO test (id, name) VALUES (1, 'test')");
    
    $stmt = $pdo->query("SELECT * FROM test WHERE id = 1");
    $result = $stmt->fetch();
    
    if ($result && $result['name'] === 'test') {
        $testResult = true;
    }
    
    // Clean up
    if (file_exists($dbPath)) {
        unlink($dbPath);
    }
    
} catch (Exception $e) {
    $testError = $e->getMessage();
}

$checks['sqlite_test_success'] = $testResult;
$checks['sqlite_test_error'] = $testError;

echo json_encode([
    'success' => $checks['pdo_sqlite_available'] && $testResult,
    'checks' => $checks
], JSON_PRETTY_PRINT);
?>