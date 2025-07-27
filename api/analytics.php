<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'search':
            searchByFolio($pdo);
            break;
        case 'top_quinelas':
            getTopQuinelas($pdo);
            break;
        case 'success_rate':
            getSuccessRate($pdo);
            break;
        default:
            throw new Exception('Acción no válida');
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function searchByFolio($pdo) {
    $folio = $_GET['folio'] ?? '';
    
    if (empty($folio)) {
        throw new Exception('Folio requerido');
    }
    
    // Get prediction data
    $stmt = $pdo->prepare("
        SELECT p.*, qt.name as quinela_name, qt.description 
        FROM predictions p 
        JOIN quinela_types qt ON p.quinela_type_id = qt.id 
        WHERE p.folio = ?
    ");
    $stmt->execute([$folio]);
    $prediction = $stmt->fetch();
    
    if (!$prediction) {
        throw new Exception('Folio no encontrado');
    }
    
    // Get matches for this prediction
    $stmt = $pdo->prepare("
        SELECT pm.*, mr.resultado, mr.acerto
        FROM prediction_matches pm 
        LEFT JOIN match_results mr ON pm.id = mr.prediction_match_id
        WHERE pm.prediction_id = ? 
        ORDER BY pm.match_number
    ");
    $stmt->execute([$prediction['id']]);
    $matches = $stmt->fetchAll();
    
    // Calculate total aciertos
    $totalAciertos = 0;
    foreach ($matches as $match) {
        if ($match['acerto']) $totalAciertos++;
    }
    
    $prediction['matches'] = $matches;
    $prediction['total_aciertos'] = $totalAciertos;
    
    echo json_encode([
        'success' => true,
        'data' => $prediction
    ]);
}

function getTopQuinelas($pdo) {
    // Create match_results table if it doesn't exist
    createMatchResultsTable($pdo);
    
    $stmt = $pdo->query("
        SELECT p.folio, COUNT(mr.acerto) as aciertos
        FROM predictions p
        LEFT JOIN prediction_matches pm ON p.id = pm.prediction_id
        LEFT JOIN match_results mr ON pm.id = mr.prediction_match_id AND mr.acerto = 1
        GROUP BY p.id, p.folio
        HAVING COUNT(pm.id) > 0
        ORDER BY aciertos DESC
        LIMIT 10
    ");
    
    $results = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $results
    ]);
}

function getSuccessRate($pdo) {
    // Create match_results table if it doesn't exist
    createMatchResultsTable($pdo);
    
    $stmt = $pdo->query("
        SELECT 
            pm.match_number,
            COUNT(*) as total_predictions,
            COUNT(CASE WHEN mr.acerto = 1 THEN 1 END) as successful_predictions,
            ROUND(
                (COUNT(CASE WHEN mr.acerto = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2
            ) as success_rate
        FROM prediction_matches pm
        LEFT JOIN match_results mr ON pm.id = mr.prediction_match_id
        GROUP BY pm.match_number
        ORDER BY pm.match_number
    ");
    
    $results = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $results
    ]);
}

function createMatchResultsTable($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS match_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction_match_id INTEGER NOT NULL,
            resultado VARCHAR(10) NOT NULL,
            acerto BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (prediction_match_id) REFERENCES prediction_matches(id),
            UNIQUE(prediction_match_id)
        )
    ");
}
?>