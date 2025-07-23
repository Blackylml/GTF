-- Database schema for quinelas prediction system

-- Quinela types/categories
CREATE TABLE IF NOT EXISTS quinela_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- percentage
    accumulated_pot DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User predictions
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio VARCHAR(20) UNIQUE NOT NULL,
    quinela_type_id INTEGER NOT NULL,
    user_ip VARCHAR(45),
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'validated', 'rejected'
    validated_at DATETIME NULL,
    validated_by VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_matches INTEGER DEFAULT 12,
    FOREIGN KEY (quinela_type_id) REFERENCES quinela_types(id)
);

CREATE TABLE IF NOT EXISTS prediction_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER,
    match_number INTEGER,
    home_team VARCHAR(100),
    away_team VARCHAR(100),
    prediction VARCHAR(10), -- 'home', 'away', 'draw'
    match_date VARCHAR(20),
    league VARCHAR(20), -- 'Liga MX' or 'MLS'
    FOREIGN KEY (prediction_id) REFERENCES predictions(id)
);

-- Insert default quinela type
INSERT OR IGNORE INTO quinela_types (id, name, description, price, commission_rate, accumulated_pot)
VALUES (1, 'Liga MX + MLS', '9 partidos de Liga MX + 3 partidos de MLS', 50.00, 10.00, 0.00);

CREATE INDEX IF NOT EXISTS idx_folio ON predictions(folio);
CREATE INDEX IF NOT EXISTS idx_prediction_id ON prediction_matches(prediction_id);
CREATE INDEX IF NOT EXISTS idx_quinela_type ON predictions(quinela_type_id);