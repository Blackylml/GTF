<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

class ValidateAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function validatePrediction($folio, $action, $validatedBy = 'admin') {
        try {
            // Get prediction details
            $stmt = $this->db->prepare("
                SELECT p.*, qt.price, qt.commission_rate 
                FROM predictions p 
                JOIN quinela_types qt ON p.quinela_type_id = qt.id 
                WHERE p.folio = ? AND p.payment_status = 'pending'
            ");
            $stmt->execute([$folio]);
            $prediction = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$prediction) {
                throw new Exception('Folio no encontrado o ya fue procesado');
            }
            
            $this->db->beginTransaction();
            
            // Update prediction status
            $newStatus = ($action === 'validate') ? 'validated' : 'rejected';
            $stmt = $this->db->prepare("
                UPDATE predictions 
                SET payment_status = ?, validated_at = CURRENT_TIMESTAMP, validated_by = ? 
                WHERE folio = ?
            ");
            $stmt->execute([$newStatus, $validatedBy, $folio]);
            
            // If validated, update accumulated pot
            if ($action === 'validate') {
                $commissionRate = $prediction['commission_rate'] / 100;
                $netAmount = $prediction['price'] * (1 - $commissionRate);
                
                $stmt = $this->db->prepare("
                    UPDATE quinela_types 
                    SET accumulated_pot = accumulated_pot + ? 
                    WHERE id = ?
                ");
                $stmt->execute([$netAmount, $prediction['quinela_type_id']]);
                
                // Log the transaction for audit
                $this->logTransaction($prediction['id'], $prediction['price'], $netAmount, $commissionRate * $prediction['price']);
            }
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => $action === 'validate' ? 'Quinela validada exitosamente' : 'Quinela rechazada',
                'folio' => $folio,
                'status' => $newStatus,
                'net_amount' => $action === 'validate' ? $netAmount : 0
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function logTransaction($predictionId, $grossAmount, $netAmount, $commission) {
        // Create transactions table if it doesn't exist
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id INTEGER,
                gross_amount DECIMAL(10,2),
                net_amount DECIMAL(10,2),
                commission DECIMAL(10,2),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prediction_id) REFERENCES predictions(id)
            )
        ");
        
        $stmt = $this->db->prepare("
            INSERT INTO transactions (prediction_id, gross_amount, net_amount, commission) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$predictionId, $grossAmount, $netAmount, $commission]);
    }
    
    public function getPendingPredictions() {
        try {
            $stmt = $this->db->prepare("
                SELECT p.folio, p.created_at, qt.name as quinela_name, qt.price, p.user_ip
                FROM predictions p 
                JOIN quinela_types qt ON p.quinela_type_id = qt.id 
                WHERE p.payment_status = 'pending' 
                ORDER BY p.created_at DESC
            ");
            $stmt->execute();
            $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'pending_predictions' => $pending
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
$validateAPI = new ValidateAPI();

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
        exit;
    }
    
    if (isset($input['action']) && isset($input['folio'])) {
        $result = $validateAPI->validatePrediction(
            $input['folio'], 
            $input['action'], 
            $input['validated_by'] ?? 'admin'
        );
    } else {
        $result = ['success' => false, 'error' => 'Missing required parameters'];
    }
    
    echo json_encode($result);
    
} elseif ($method === 'GET' && isset($_GET['pending'])) {
    $result = $validateAPI->getPendingPredictions();
    echo json_encode($result);
    
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
}
?>