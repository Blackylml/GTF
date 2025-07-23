<?php
header('Content-Type: application/json');

try {
    $dbPath = __DIR__ . '/database/quinelas.db';
    
    // Delete the old database to start fresh
    if (file_exists($dbPath)) {
        unlink($dbPath);
        echo json_encode(['message' => 'Old database deleted']);
    }
    
    // Now try to create the database with the correct schema
    require_once 'config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify the new structure
    $stmt = $db->query("PRAGMA table_info(predictions)");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $db->query("SELECT * FROM quinela_types");
    $quinelTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Database recreated successfully',
        'predictions_columns' => $columns,
        'quinela_types' => $quinelTypes
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>