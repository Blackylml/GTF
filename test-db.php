<?php
header('Content-Type: application/json');

try {
    require_once 'config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Test database connection
    $stmt = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Test quinela_types table
    $stmt = $db->query("SELECT * FROM quinela_types WHERE is_active = 1");
    $quinelTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'tables' => $tables,
        'quinela_types' => $quinelTypes
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>