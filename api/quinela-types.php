<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config/database.php';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database initialization failed: ' . $e->getMessage()
    ]);
    exit;
}

class QuinelaTypesAPI {
    private $db;
    
    public function __construct() {
        try {
            $database = new Database();
            $this->db = $database->getConnection();
        } catch (Exception $e) {
            throw new Exception('Failed to connect to database: ' . $e->getMessage());
        }
    }
    
    public function getActiveQuinelaTypes() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    id,
                    name,
                    description,
                    price,
                    commission_rate,
                    accumulated_pot,
                    created_at,
                    (SELECT COUNT(*) FROM predictions WHERE quinela_type_id = qt.id AND payment_status = 'validated') as validated_count,
                    (SELECT COUNT(*) FROM predictions WHERE quinela_type_id = qt.id AND payment_status = 'pending') as pending_count
                FROM quinela_types qt 
                WHERE is_active = 1 
                ORDER BY created_at ASC
            ");
            $stmt->execute();
            $quinelTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'success' => true,
                'quinela_types' => $quinelTypes
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    public function getQuinelaTypeById($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    id,
                    name,
                    description,
                    price,
                    commission_rate,
                    accumulated_pot,
                    created_at
                FROM quinela_types 
                WHERE id = ? AND is_active = 1
            ");
            $stmt->execute([$id]);
            $quinelType = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$quinelType) {
                throw new Exception('Quinela type not found');
            }
            
            return [
                'success' => true,
                'quinela_type' => $quinelType
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    public function updateAccumulatedPot($quinelaTypeId, $amount) {
        try {
            $stmt = $this->db->prepare("
                UPDATE quinela_types 
                SET accumulated_pot = accumulated_pot + ? 
                WHERE id = ?
            ");
            $stmt->execute([$amount, $quinelaTypeId]);
            
            return [
                'success' => true,
                'message' => 'Accumulated pot updated successfully'
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
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $quinelaTypesAPI = new QuinelaTypesAPI();

    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $result = $quinelaTypesAPI->getQuinelaTypeById($_GET['id']);
        } else {
            $result = $quinelaTypesAPI->getActiveQuinelaTypes();
        }
        echo json_encode($result);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid request method'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>