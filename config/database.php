<?php
class Database {
    private $db;
    
    public function __construct() {
        try {
            // Check if SQLite is available
            if (!extension_loaded('pdo_sqlite')) {
                throw new Exception('SQLite PDO extension is not loaded. Please enable it in php.ini');
            }
            
            // Ensure database directory exists with proper permissions
            $dbDir = __DIR__ . '/../database';
            
            // For Railway deployment, ensure writable directory
            if ($_ENV['RAILWAY_ENVIRONMENT'] ?? false) {
                $dbDir = '/tmp/database';
            }
            
            if (!is_dir($dbDir)) {
                if (!mkdir($dbDir, 0777, true)) {
                    throw new Exception('Cannot create database directory: ' . $dbDir);
                }
            }
            
            // Check if directory is writable
            if (!is_writable($dbDir)) {
                throw new Exception('Database directory is not writable: ' . $dbDir);
            }
            
            $dbPath = $dbDir . '/quinelas.db';
            
            // Create PDO connection
            $this->db = new PDO('sqlite:' . $dbPath);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Enable foreign keys
            $this->db->exec('PRAGMA foreign_keys = ON');
            
            $this->initDatabase();
        } catch (PDOException $e) {
            $errorMsg = 'Database PDO error: ' . $e->getMessage();
            error_log($errorMsg);
            throw new Exception($errorMsg);
        } catch (Exception $e) {
            error_log('Database setup error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    private function initDatabase() {
        try {
            // Create tables directly in PHP instead of reading SQL file
            $this->createTables();
            $this->insertDefaultData();
        } catch (Exception $e) {
            error_log('Database initialization failed: ' . $e->getMessage());
            throw new Exception('Database initialization failed: ' . $e->getMessage());
        }
    }
    
    private function createTables() {
        // Check if we need to migrate from old schema
        $this->checkAndMigrateSchema();
        
        // Create quinela_types table first (needed for foreign key)
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS quinela_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL DEFAULT 50.00,
                commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
                accumulated_pot DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Create predictions table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                folio VARCHAR(20) UNIQUE NOT NULL,
                quinela_type_id INTEGER NOT NULL,
                user_ip VARCHAR(45),
                payment_status VARCHAR(20) DEFAULT 'pending',
                validated_at DATETIME NULL,
                validated_by VARCHAR(100) NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_matches INTEGER DEFAULT 12,
                FOREIGN KEY (quinela_type_id) REFERENCES quinela_types(id)
            )
        ");
        
        // Create prediction_matches table
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS prediction_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id INTEGER,
                match_number INTEGER,
                home_team VARCHAR(100),
                away_team VARCHAR(100),
                prediction VARCHAR(10),
                match_date VARCHAR(20),
                league VARCHAR(20),
                FOREIGN KEY (prediction_id) REFERENCES predictions(id)
            )
        ");
        
        // Create match_results table for admin to store real results
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS match_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_key VARCHAR(100) UNIQUE NOT NULL,
                match_name VARCHAR(200) NOT NULL,
                result VARCHAR(100) NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(100) DEFAULT 'admin'
            )
        ");
        
        // Create indexes
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_folio ON predictions(folio)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_prediction_id ON prediction_matches(prediction_id)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_quinela_type ON predictions(quinela_type_id)");
        $this->db->exec("CREATE INDEX IF NOT EXISTS idx_match_key ON match_results(match_key)");
    }
    
    private function checkAndMigrateSchema() {
        // Check if predictions table exists with old schema
        $result = $this->db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='predictions'")->fetch();
        
        if ($result) {
            // Check if quinela_type_id column exists
            $stmt = $this->db->query("PRAGMA table_info(predictions)");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $hasQuinelaTypeId = false;
            foreach ($columns as $column) {
                if ($column['name'] === 'quinela_type_id') {
                    $hasQuinelaTypeId = true;
                    break;
                }
            }
            
            if (!$hasQuinelaTypeId) {
                // Drop and recreate tables with new schema
                $this->db->exec("DROP TABLE IF EXISTS prediction_matches");
                $this->db->exec("DROP TABLE IF EXISTS predictions");
                $this->db->exec("DROP TABLE IF EXISTS quinela_types");
            }
        }
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