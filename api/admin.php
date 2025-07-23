<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class AdminAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function getRecentPredictions($limit = 10) {
        try {
            $stmt = $this->db->prepare("
                SELECT folio, created_at, total_matches, user_ip
                FROM predictions 
                ORDER BY created_at DESC 
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            $predictions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'predictions' => $predictions
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    public function getStatistics() {
        try {
            // Total predictions
            $stmt = $this->db->query("SELECT COUNT(*) as total FROM predictions");
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Predictions by league
            $stmt = $this->db->query("
                SELECT league, COUNT(*) as count 
                FROM prediction_matches 
                GROUP BY league
            ");
            $byLeague = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Most predicted teams
            $stmt = $this->db->query("
                SELECT 
                    CASE 
                        WHEN prediction = 'home' THEN home_team
                        WHEN prediction = 'away' THEN away_team
                        ELSE 'Empate'
                    END as predicted_team,
                    COUNT(*) as count
                FROM prediction_matches
                GROUP BY predicted_team
                ORDER BY count DESC
                LIMIT 10
            ");
            $topPredictions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'statistics' => [
                    'total_predictions' => $total,
                    'by_league' => $byLeague,
                    'top_predictions' => $topPredictions
                ]
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
$action = $_GET['action'] ?? 'recent';
$adminAPI = new AdminAPI();

switch ($action) {
    case 'recent':
        $limit = intval($_GET['limit'] ?? 10);
        $result = $adminAPI->getRecentPredictions($limit);
        break;
        
    case 'stats':
        $result = $adminAPI->getStatistics();
        break;
        
    default:
        $result = [
            'success' => false,
            'error' => 'Invalid action'
        ];
}

echo json_encode($result);
?>