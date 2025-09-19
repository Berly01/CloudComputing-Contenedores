USE diario_personal;

-- Crear tabla de entradas del diario
CREATE TABLE IF NOT EXISTS entradas_diario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fecha ON entradas_diario(fecha);
CREATE INDEX idx_fecha_creacion ON entradas_diario(fecha_creacion);

INSERT IGNORE INTO entradas_diario (fecha, contenido) VALUES 
('2025-01-01', 'Este es un mensaje de prueba de una diario web utilizando 3 contenedores.');

SHOW TABLES;
DESCRIBE entradas_diario;