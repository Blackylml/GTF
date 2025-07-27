<?php
// Script temporal para ver datos - ELIMINAR DESPUÉS DE USAR
require_once 'config/database.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    echo "<h2>Backup de datos - Quinelas GTF</h2>";
    echo "<pre>";
    
    // Quinela Types
    echo "\n=== QUINELA TYPES ===\n";
    $stmt = $pdo->query("SELECT * FROM quinela_types");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($data);
    
    // Predictions
    echo "\n=== PREDICTIONS ===\n";
    $stmt = $pdo->query("SELECT * FROM predictions ORDER BY created_at DESC LIMIT 10");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($data);
    
    // Prediction Matches (últimos 20)
    echo "\n=== PREDICTION MATCHES (últimos 20) ===\n";
    $stmt = $pdo->query("SELECT * FROM prediction_matches ORDER BY id DESC LIMIT 20");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($data);
    
    // Match Results
    echo "\n=== MATCH RESULTS ===\n";
    $stmt = $pdo->query("SELECT * FROM match_results");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($data);
    
    echo "</pre>";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>