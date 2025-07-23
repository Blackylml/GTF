<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class MatchesAPI {
    private $apiKey;
    private $apiHost = 'api-football-v1.p.rapidapi.com';
    
    public function __construct() {
        $this->apiKey = $_ENV['RAPIDAPI_KEY'] ?? '1dec45416emsh269d1d4adce38e2p136b9bjsn951df1a6d6c5';
    }
    
    private $ligaMxId = 262;
    
    public function getLigaMXMatches() {
        $dates = $this->getWeekendDates();
        
        $url = "https://{$this->apiHost}/v3/fixtures";
        $params = [
            'league' => $this->ligaMxId,
            'season' => 2025,
            'from' => $dates['from'],
            'to' => $dates['to']
        ];
        
        $headers = [
            'X-RapidAPI-Key: ' . $this->apiKey,
            'X-RapidAPI-Host: ' . $this->apiHost
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("API Error: HTTP $httpCode");
        }
        
        $data = json_decode($response, true);
        return $data['response'] ?? [];
    }
    
    public function getMLS_Matches() {
        // Hardcoded MLS matches as requested
        $baseDate = date('Y-m-d H:i:s', strtotime('next saturday'));
        
        return [
            [
                'fixture' => [
                    'id' => 'mls_1',
                    'date' => $baseDate,
                    'venue' => ['name' => 'Toyota Stadium']
                ],
                'teams' => [
                    'home' => ['name' => 'FC Dallas'],
                    'away' => ['name' => 'New York City FC']
                ],
                'league' => ['round' => 'MLS Regular Season']
            ],
            [
                'fixture' => [
                    'id' => 'mls_2',
                    'date' => date('Y-m-d H:i:s', strtotime('next saturday +3 hours')),
                    'venue' => ['name' => 'BMO Stadium']
                ],
                'teams' => [
                    'home' => ['name' => 'LAFC'],
                    'away' => ['name' => 'Portland Timbers']
                ],
                'league' => ['round' => 'MLS Regular Season']
            ],
            [
                'fixture' => [
                    'id' => 'mls_3',
                    'date' => date('Y-m-d H:i:s', strtotime('next sunday')),
                    'venue' => ['name' => 'Chase Stadium']
                ],
                'teams' => [
                    'home' => ['name' => 'Inter Miami CF'],
                    'away' => ['name' => 'FC Cincinnati']
                ],
                'league' => ['round' => 'MLS Regular Season']
            ]
        ];
    }
    
    private function getWeekendDates() {
        // Get Friday to Sunday of current week
        $friday = date('Y-m-d', strtotime('friday this week'));
        $sunday = date('Y-m-d', strtotime('sunday this week'));
        
        return [
            'from' => $friday,
            'to' => $sunday
        ];
    }
    
    public function getAllMatches() {
        try {
            $ligaMxMatches = $this->getLigaMXMatches();
            $mlsMatches = $this->getMLS_Matches();
            
            // Limit Liga MX to 9 matches
            $ligaMxMatches = array_slice($ligaMxMatches, 0, 9);
            
            return [
                'success' => true,
                'liga_mx' => $ligaMxMatches,
                'mls' => $mlsMatches,
                'total_matches' => count($ligaMxMatches) + count($mlsMatches)
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
$matchesAPI = new MatchesAPI();
$result = $matchesAPI->getAllMatches();

echo json_encode($result);
?>