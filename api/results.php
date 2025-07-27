<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class ResultsAPI {
    
    private $usersFile;
    private $resultsFile;
    private $matchNamesFile;
    
    public function __construct() {
        $this->usersFile = __DIR__ . '/../data/users.json';
        $this->resultsFile = __DIR__ . '/../data/match-results.json';
        $this->matchNamesFile = __DIR__ . '/../data/match-names.json';
    }
    
    private function loadUsers() {
        if (!file_exists($this->usersFile)) {
            throw new Exception('Archivo de usuarios no encontrado');
        }
        
        $json = file_get_contents($this->usersFile);
        $data = json_decode($json, true);
        
        if ($data === null) {
            throw new Exception('Error al leer archivo de usuarios');
        }
        
        return $data;
    }
    
    private function loadResults() {
        if (!file_exists($this->resultsFile)) {
            throw new Exception('Archivo de resultados no encontrado');
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

    public function getResults() {
        try {
            $users = $this->loadUsers();
            $realResults = $this->loadResults();
            $matchNames = $this->loadMatchNames();
            
            $results = [];
            
            foreach ($users as $user) {
                $aciertos = $this->calculateHits($user['predicciones'], $realResults);
                $total = count($user['predicciones']);
                $porcentaje = $total > 0 ? round(($aciertos / $total) * 100, 1) : 0;
                
                $results[] = [
                    'folio' => $user['folio'],
                    'aciertos' => $aciertos,
                    'total' => $total,
                    'porcentaje' => $porcentaje,
                    'predicciones' => $user['predicciones']
                ];
            }
            
            // Sort by hits (descending) and then by percentage
            usort($results, function($a, $b) {
                if ($a['aciertos'] == $b['aciertos']) {
                    return $b['porcentaje'] <=> $a['porcentaje'];
                }
                return $b['aciertos'] <=> $a['aciertos'];
            });
            
            return [
                'success' => true,
                'data' => [
                    'results' => $results,
                    'real_results' => $realResults,
                    'match_names' => $matchNames
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    public function searchFolio($folio) {
        try {
            $users = $this->loadUsers();
            $realResults = $this->loadResults();
            $matchNames = $this->loadMatchNames();
            
            $folio = strtoupper(trim($folio));
            
            foreach ($users as $user) {
                if ($user['folio'] === $folio) {
                    $aciertos = $this->calculateHits($user['predicciones'], $realResults);
                    $total = count($user['predicciones']);
                    $porcentaje = $total > 0 ? round(($aciertos / $total) * 100, 1) : 0;
                    
                    return [
                        'success' => true,
                        'data' => [
                            'folio' => $user['folio'],
                            'aciertos' => $aciertos,
                            'total' => $total,
                            'porcentaje' => $porcentaje,
                            'predicciones' => $user['predicciones'],
                            'real_results' => $realResults,
                            'match_names' => $matchNames
                        ]
                    ];
                }
            }
            
            return [
                'success' => false,
                'error' => 'Folio no encontrado'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function calculateHits($predicciones, $realResults) {
        $hits = 0;
        
        foreach ($predicciones as $match => $prediction) {
            if (isset($realResults[$match]) && !empty($realResults[$match]) && $realResults[$match] === $prediction) {
                $hits++;
            }
        }
        
        return $hits;
    }
}

// Handle the request
$method = $_SERVER['REQUEST_METHOD'];
$api = new ResultsAPI();

if ($method === 'GET') {
    if (isset($_GET['folio'])) {
        // Search specific folio
        $result = $api->searchFolio($_GET['folio']);
    } else {
        // Get all results
        $result = $api->getResults();
    }
    
    echo json_encode($result);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}
?>