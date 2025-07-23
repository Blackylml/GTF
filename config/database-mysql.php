<?php
class DatabaseMySQL {
    private $db;
    private $host = 'localhost';
    private $dbname = 'quinelas';
    private $username = 'root';
    private $password = '';
    
    public function __construct() {
        try {
            // Create database if it doesn't exist
            $pdo = new PDO("mysql:host={$this->host}", $this->username, $this->password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS {$this->dbname} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            
            // Connect to the database
            $this->db = new PDO("mysql:host={$this->host};dbname={$this->dbname}", $this->username, $this->password);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            $this->initDatabase();
        } catch (PDOException $e) {
            $errorMsg = 'MySQL Database error: ' . $e->getMessage();
            error_log($errorMsg);
            throw new Exception($errorMsg);
        }
    }
    
    private function initDatabase() {
        try {
            $this->createTables();
            $this->insertDefaultData();
        } catch (Exception $e) {
            error_log('MySQL Database initialization failed: ' . $e->getMessage());
            throw new Exception('MySQL Database initialization failed: ' . $e->getMessage());
        }
    }
    
    private function createTables() {
        // Create quinela_types table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS quinela_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL DEFAULT 50.00,
                commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
                accumulated_pot DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        ");
        
        // Create predictions table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS predictions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folio VARCHAR(20) UNIQUE NOT NULL,
                quinela_type_id INT NOT NULL,
                user_ip VARCHAR(45),
                payment_status VARCHAR(20) DEFAULT 'pending',
                validated_at TIMESTAMP NULL,
                validated_by VARCHAR(100) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_matches INT DEFAULT 12,
                FOREIGN KEY (quinela_type_id) REFERENCES quinela_types(id)
            ) ENGINE=InnoDB
        ");
        
        // Create prediction_matches table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS prediction_matches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                prediction_id INT,
                match_number INT,
                home_team VARCHAR(100),
                away_team VARCHAR(100),
                prediction VARCHAR(10),
                match_date VARCHAR(20),
                league VARCHAR(20),
                FOREIGN KEY (prediction_id) REFERENCES predictions(id)
            ) ENGINE=InnoDB
        ");
        
        // Create indexes
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_folio ON predictions(folio)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_prediction_id ON prediction_matches(prediction_id)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_quinela_type ON predictions(quinela_type_id)");
    }
    
    private function insertDefaultData() {
        // Check if default quinela type already exists
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM quinela_types WHERE id = 1");
        $stmt->execute();
        
        if ($stmt->fetchColumn() == 0) {
            $stmt = $this->db->prepare("
                INSERT INTO quinela_types (id, name, description, price, commission_rate, accumulated_pot)
                VALUES (1, 'Liga MX + MLS', '9 partidos de Liga MX + 3 partidos de MLS', 50.00, 10.00, 0.00)
            ");
            $stmt->execute();
        }
    }
    
    public function getConnection() {
        return $this->db;
    }
    
    public function generateFolio() {
        do {
            $folio = 'Q' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM predictions WHERE folio = ?");
            $stmt->execute([$folio]);
        } while ($stmt->fetchColumn() > 0);
        
        return $folio;
    }
}
?>