<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class SubmitAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function submitPrediction($data) {
        try {
            if (!isset($data['predictions']) || count($data['predictions']) !== 12) {
                throw new Exception('Debe seleccionar exactamente 12 partidos');
            }
            
            if (!isset($data['quinela_type_id'])) {
                throw new Exception('Debe seleccionar un tipo de quinela');
            }
            
            // Validate quinela type exists and is active
            $stmt = $this->db->prepare("SELECT id FROM quinela_types WHERE id = ? AND is_active = 1");
            $stmt->execute([$data['quinela_type_id']]);
            if (!$stmt->fetch()) {
                throw new Exception('Tipo de quinela no válido');
            }
            
            $this->db->beginTransaction();
            
            // Generate folio
            $folio = $this->generateFolio();
            $userIP = $this->getUserIP();
            
            // Insert main prediction record
            $stmt = $this->db->prepare("
                INSERT INTO predictions (folio, quinela_type_id, user_ip, total_matches, payment_status) 
                VALUES (?, ?, ?, ?, 'pending')
            ");
            $stmt->execute([$folio, $data['quinela_type_id'], $userIP, 12]);
            $predictionId = $this->db->lastInsertId();
            
            // Insert each match prediction
            $matchStmt = $this->db->prepare("
                INSERT INTO prediction_matches 
                (prediction_id, match_number, home_team, away_team, prediction, match_date, league) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($data['predictions'] as $matchNumber => $prediction) {
                $matchStmt->execute([
                    $predictionId,
                    $matchNumber,
                    $prediction['homeTeam'],
                    $prediction['awayTeam'],
                    $prediction['prediction'],
                    $prediction['matchDate'],
                    $prediction['league']
                ]);
            }
            
            $this->db->commit();
            
            return [
                'success' => true,
                'folio' => $folio,
                'prediction_id' => $predictionId
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    private function generateFolio() {
        do {
            $folio = 'Q' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM predictions WHERE folio = ?");
            $stmt->execute([$folio]);
        } while ($stmt->fetchColumn() > 0);
        
        return $folio;
    }
    
    private function getUserIP() {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        }
    }
    
    public function getPredictionByFolio($folio) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, pm.* 
                FROM predictions p 
                LEFT JOIN prediction_matches pm ON p.id = pm.prediction_id 
                WHERE p.folio = ?
                ORDER BY pm.match_number
            ");
            $stmt->execute([$folio]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($results)) {
                throw new Exception('Folio no encontrado');
            }
            
            $prediction = [
                'folio' => $results[0]['folio'],
                'created_at' => $results[0]['created_at'],
                'total_matches' => $results[0]['total_matches'],
                'matches' => []
            ];
            
            foreach ($results as $row) {
                if ($row['match_number'] !== null) {
                    $prediction['matches'][] = [
                        'match_number' => $row['match_number'],
                        'home_team' => $row['home_team'],
                        'away_team' => $row['away_team'],
                        'prediction' => $row['prediction'],
                        'match_date' => $row['match_date'],
                        'league' => $row['league']
                    ];
                }
            }
            
            return [
                'success' => true,
                'prediction' => $prediction
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}

// Handle the request
$method = $_SERVER['REQUEST_METHOD'];
$submitAPI = new SubmitAPI();

if ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data');
        }
        
        $result = $submitAPI->submitPrediction($input);
        echo json_encode($result);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
} elseif ($method === 'GET' && isset($_GET['folio'])) {
    $result = $submitAPI->getPredictionByFolio($_GET['folio']);
    echo json_encode($result);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request method or missing parameters'
    ]);
}
?>