-- Script de inicialización para MySQL
-- Este archivo se ejecuta automáticamente al inicializar el contenedor

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

-- Crear índices para mejorar performance
CREATE INDEX idx_fecha ON entradas_diario(fecha);
CREATE INDEX idx_fecha_creacion ON entradas_diario(fecha_creacion);

-- Insertar datos de ejemplo (opcional)
INSERT IGNORE INTO entradas_diario (fecha, contenido) VALUES 
('2024-01-01', 'Feliz Año Nuevo! Hoy comienza un nuevo capítulo en mi vida. Quiero usar este diario para documentar mis pensamientos y experiencias a lo largo del año.'),
('2024-01-02', 'Segundo día del año. He decidido ser más constante con mis hábitos. Escribir en este diario será una de mis nuevas rutinas.'),
('2024-01-15', 'Han pasado dos semanas del nuevo año. He mantenido algunas resoluciones pero otras han sido más difíciles. La constancia es clave.');

-- Mostrar información de las tablas creadas
SHOW TABLES;
DESCRIBE entradas_diario;