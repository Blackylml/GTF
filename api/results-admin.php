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
    
    // Create match_results table if it doesn't exist
    createMatchResultsTable($pdo);
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'save_results':
                saveResults($pdo, $input);
                break;
            default:
                throw new Exception('Acción POST no válida');
        }
    } else {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'get_matches':
                getMatches($pdo);
                break;
            case 'get_statistics':
                getStatistics($pdo);
                break;
            default:
                throw new Exception('Acción GET no válida');
        }
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function getMatches($pdo) {
    $quinelaTypeId = $_GET['quinela_type_id'] ?? '';
    $date = $_GET['date'] ?? '';
    
    if (empty($quinelaTypeId) || empty($date)) {
        throw new Exception('Tipo de quinela y fecha requeridos');
    }
    
    // Get all unique matches for the selected quinela type and date
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            pm.match_number,
            pm.home_team,
            pm.away_team,
            pm.match_date,
            pm.league,
            mr.resultado as current_result,
            COUNT(CASE WHEN pm.prediction = '1' THEN 1 END) as predictions_1,
            COUNT(CASE WHEN pm.prediction = 'X' THEN 1 END) as predictions_x,
            COUNT(CASE WHEN pm.prediction = '2' THEN 1 END) as predictions_2
        FROM prediction_matches pm
        JOIN predictions p ON pm.prediction_id = p.id
        LEFT JOIN match_results mr ON pm.id = mr.prediction_match_id
        WHERE p.quinela_type_id = ? 
        AND DATE(p.created_at) = ?
        GROUP BY pm.match_number, pm.home_team, pm.away_team, pm.match_date, pm.league, mr.resultado
        ORDER BY pm.match_number
    ");
    
    $stmt->execute([$quinelaTypeId, $date]);
    $matches = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'matches' => $matches
    ]);
}

function saveResults($pdo, $input) {
    $results = $input['results'] ?? [];
    $quinelaTypeId = $input['quinela_type_id'] ?? '';
    $date = $input['date'] ?? '';
    
    if (empty($results) || empty($quinelaTypeId) || empty($date)) {
        throw new Exception('Datos incompletos');
    }
    
    $pdo->beginTransaction();
    
    try {
        $savedCount = 0;
        $totalHits = 0;
        
        foreach ($results as $resultData) {
            $matchData = $resultData['match_data'];
            $result = $resultData['result'];
            
            // Get all prediction matches for this specific match
            $stmt = $pdo->prepare("
                SELECT pm.id, pm.prediction
                FROM prediction_matches pm
                JOIN predictions p ON pm.prediction_id = p.id
                WHERE p.quinela_type_id = ? 
                AND DATE(p.created_at) = ?
                AND pm.match_number = ?
                AND pm.home_team = ?
                AND pm.away_team = ?
            ");
            
            $stmt->execute([
                $quinelaTypeId, 
                $date, 
                $matchData['match_number'],
                $matchData['home_team'],
                $matchData['away_team']
            ]);
            
            $predictionMatches = $stmt->fetchAll();
            
            foreach ($predictionMatches as $pm) {
                $acerto = ($pm['prediction'] === $result) ? 1 : 0;
                if ($acerto) $totalHits++;
                
                // Insert or update match result
                $stmt = $pdo->prepare("
                    INSERT OR REPLACE INTO match_results 
                    (prediction_match_id, resultado, acerto, created_at) 
                    VALUES (?, ?, ?, datetime('now'))
                ");
                
                $stmt->execute([$pm['id'], $result, $acerto]);
            }
            
            $savedCount++;
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'saved_count' => $savedCount,
            'total_hits' => $totalHits,
            'message' => 'Resultados guardados correctamente'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function getStatistics($pdo) {
    // Total predictions
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM predictions");
    $totalPredictions = $stmt->fetch()['total'];
    
    // Total hits
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM match_results WHERE acerto = 1");
    $totalHits = $stmt->fetch()['total'];
    
    // Average hits per quinela
    $stmt = $pdo->query("
        SELECT AVG(hits_per_quinela) as avg_hits
        FROM (
            SELECT p.id, COUNT(mr.acerto) as hits_per_quinela
            FROM predictions p
            LEFT JOIN prediction_matches pm ON p.id = pm.prediction_id
            LEFT JOIN match_results mr ON pm.id = mr.prediction_match_id AND mr.acerto = 1
            GROUP BY p.id
        ) subquery
    ");
    $avgHits = round($stmt->fetch()['avg_hits'], 2);
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_predictions' => $totalPredictions,
            'total_hits' => $totalHits,
            'avg_hits_per_quinela' => $avgHits
        ]
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