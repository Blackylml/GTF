<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class ResultsAdminAPI {
    private $resultsFile;
    private $matchNamesFile;
    
    public function __construct() {
        $this->resultsFile = __DIR__ . '/../data/match-results.json';
        $this->matchNamesFile = __DIR__ . '/../data/match-names.json';
        
        // Ensure data directory exists
        $dataDir = __DIR__ . '/../data';
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0777, true);
        }
    }
    
    private function loadResults() {
        if (!file_exists($this->resultsFile)) {
            // Create empty results file if it doesn't exist
            $this->saveResultsToFile([]);
            return [];
        }
        
        $json = file_get_contents($this->resultsFile);
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception('Error al leer archivo de resultados');
        }
        
        return $data;
    }
    
    private function loadMatchNames() {
        if (!file_exists($this->matchNamesFile)) {
            throw new Exception('Archivo de nombres de partidos no encontrado');
        }
        
        $json = file_get_contents($this->matchNamesFile);
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception('Error al leer archivo de nombres de partidos');
        }
        
        return $data;
    }
    
    private function saveResultsToFile($results) {
        $json = json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        
        if ($json === false) {
            throw new Exception('Error al convertir resultados a JSON');
        }
        
        if (file_put_contents($this->resultsFile, $json) === false) {
            throw new Exception('Error al guardar archivo de resultados');
        }
    }
    
    public function saveResults($results) {
        try {
            // Validate that all required matches are present
            $matchNames = $this->loadMatchNames();
            
            foreach (array_keys($matchNames) as $matchKey) {
                if (!isset($results[$matchKey])) {
                    throw new Exception("Falta el resultado para: " . $matchNames[$matchKey]);
                }
            }
            
            // Save results to JSON file
            $this->saveResultsToFile($results);
            
            return [
                'success' => true,
                'message' => 'Resultados guardados correctamente'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al guardar resultados: ' . $e->getMessage()
            ];
        }
    }
    
    public function getCurrentResults() {
        try {
            $results = $this->loadResults();
            
            return [
                'success' => true,
                'data' => $results
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al cargar resultados: ' . $e->getMessage()
            ];
        }
    }
    
    public function initializeDefaultResults() {
        try {
            $matchNames = $this->loadMatchNames();
            $currentResults = $this->loadResults();
            
            // Only initialize if file is empty or doesn't have all matches
            if (empty($currentResults) || count($currentResults) !== count($matchNames)) {
                $defaultResults = [];
                foreach (array_keys($matchNames) as $matchKey) {
                    $defaultResults[$matchKey] = '';
                }
                
                $this->saveResultsToFile($defaultResults);
            }
            
            return ['success' => true];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Error al inicializar: ' . $e->getMessage()
            ];
        }
    }
}

// Handle the request
try {
    $method = $_SERVER['REQUEST_METHOD'];
    $api = new ResultsAdminAPI();
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($input && isset($input['action'])) {
            switch ($input['action']) {
                case 'save_results':
                    if (isset($input['results'])) {
                        $result = $api->saveResults($input['results']);
                    } else {
                        $result = ['success' => false, 'error' => 'No se proporcionaron resultados'];
                    }
                    break;
                    
                default:
                    $result = ['success' => false, 'error' => 'Acción no válida'];
            }
        } else {
            $result = ['success' => false, 'error' => 'Formato de datos inválido'];
        }
        
    } else if ($method === 'GET') {
        $action = $_GET['action'] ?? 'get_current_results';
        
        switch ($action) {
            case 'get_current_results':
                $result = $api->getCurrentResults();
                break;
                
            case 'initialize':
                $result = $api->initializeDefaultResults();
                break;
                
            default:
                $result = ['success' => false, 'error' => 'Acción no válida'];
        }
    } else {
        $result = ['success' => false, 'error' => 'Método no permitido'];
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>