<?php
// Auto-detect and use the best available database option

function createDatabase() {
    // Try SQLite first
    if (extension_loaded('pdo_sqlite')) {
        try {
            require_once __DIR__ . '/database.php';
            return new Database();
        } catch (Exception $e) {
            error_log('SQLite failed: ' . $e->getMessage());
        }
    }
    
    // Fallback to MySQL
    if (extension_loaded('pdo_mysql')) {
        try {
            require_once __DIR__ . '/database-mysql.php';
            return new DatabaseMySQL();
        } catch (Exception $e) {
            error_log('MySQL failed: ' . $e->getMessage());
            throw new Exception('No database available. SQLite error: Failed to load. MySQL error: ' . $e->getMessage());
        }
    }
    
    throw new Exception('No database extensions available. Please enable PDO SQLite or PDO MySQL.');
}

// Create a wrapper class that uses the auto-detected database
class DatabaseWrapper {
    private $db;
    
    public function __construct() {
        $this->db = createDatabase();
    }
    
    public function getConnection() {
        return $this->db->getConnection();
    }
    
    public function generateFolio() {
        if (method_exists($this->db, 'generateFolio')) {
            return $this->db->generateFolio();
        }
        
        // Fallback folio generation
        $connection = $this->db->getConnection();
        do {
            $folio = 'Q' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
            $stmt = $connection->prepare("SELECT COUNT(*) FROM predictions WHERE folio = ?");
            $stmt->execute([$folio]);
        } while ($stmt->fetchColumn() > 0);
        
        return $folio;
    }
}

// For backward compatibility, alias the wrapper as Database
class Database extends DatabaseWrapper {}
?>