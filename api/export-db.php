<?php
// ⚠️ ELIMINAR ESTE ARCHIVO DESPUÉS DE USAR - SOLO PARA BACKUP TEMPORAL
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Verificar que solo se use para backup
$auth_key = $_GET['auth'] ?? '';
if ($auth_key !== 'backup_temp_2024') {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

require_once '../config/database.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();
    
    $action = $_GET['action'] ?? 'tables';
    
    switch ($action) {
        case 'tables':
            // Listar todas las tablas
            $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo json_encode(['tables' => $tables]);
            break;
            
        case 'export':
            $table = $_GET['table'] ?? '';
            if (empty($table)) {
                throw new Exception('Tabla requerida');
            }
            
            // Exportar datos de una tabla específica
            $stmt = $pdo->query("SELECT * FROM `$table`");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Generar archivo CSV
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="' . $table . '_export.csv"');
            
            if (count($data) > 0) {
                // Encabezados
                echo implode(',', array_keys($data[0])) . "\n";
                
                // Datos
                foreach ($data as $row) {
                    echo implode(',', array_map(function($value) {
                        return '"' . str_replace('"', '""', $value) . '"';
                    }, $row)) . "\n";
                }
            }
            exit;
            
        case 'full_export':
            // Exportar todas las tablas como SQL
            $tables = ['quinela_types', 'predictions', 'prediction_matches', 'match_results'];
            $sql_dump = "-- Backup de base de datos Quinelas GTF\n";
            $sql_dump .= "-- Fecha: " . date('Y-m-d H:i:s') . "\n\n";
            
            foreach ($tables as $table) {
                try {
                    // Schema de la tabla
                    $stmt = $pdo->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='$table'");
                    $schema = $stmt->fetch(PDO::FETCH_COLUMN);
                    
                    if ($schema) {
                        $sql_dump .= "-- Tabla: $table\n";
                        $sql_dump .= $schema . ";\n\n";
                        
                        // Datos de la tabla
                        $stmt = $pdo->query("SELECT * FROM `$table`");
                        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        
                        if (count($data) > 0) {
                            $sql_dump .= "-- Datos de $table\n";
                            foreach ($data as $row) {
                                $columns = implode('`, `', array_keys($row));
                                $values = implode(', ', array_map(function($value) {
                                    return is_null($value) ? 'NULL' : "'" . addslashes($value) . "'";
                                }, $row));
                                $sql_dump .= "INSERT INTO `$table` (`$columns`) VALUES ($values);\n";
                            }
                            $sql_dump .= "\n";
                        }
                    }
                } catch (Exception $e) {
                    $sql_dump .= "-- Error en tabla $table: " . $e->getMessage() . "\n\n";
                }
            }
            
            header('Content-Type: text/plain');
            header('Content-Disposition: attachment; filename="quinelas_backup_' . date('Y-m-d_H-i-s') . '.sql"');
            echo $sql_dump;
            exit;
            
        default:
            echo json_encode(['error' => 'Acción no válida']);
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>