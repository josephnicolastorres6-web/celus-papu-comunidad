const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'celuspapu_db',
        port: process.env.DB_PORT || 3306
    });

    console.log('🚀 Iniciando Migración Estructural...');

    try {
        // 1. Añadir ultima_conexion a usuarios
        console.log('👥 Actualizando tabla "usuarios"...');
        await db.execute('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

        // 2. Añadir usuario_id a comentarios
        console.log('💬 Actualizando tabla "comentarios"...');
        const [cols] = await db.execute('SHOW COLUMNS FROM comentarios LIKE "usuario_id"');
        if (cols.length === 0) {
            await db.execute('ALTER TABLE comentarios ADD COLUMN usuario_id INT DEFAULT NULL');
            await db.execute('ALTER TABLE comentarios ADD CONSTRAINT fk_comentario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL');
        }

        // 3. Ajustar FK de admin_id (permitir NULL para comentarios de clientes)
        console.log('🛡️  Ajustando integridad de comentarios...');
        await db.execute('ALTER TABLE comentarios MODIFY admin_id INT NULL');

        console.log('✅ Migración completada con éxito.');
    } catch (e) {
        console.error('❌ Error en migración:', e);
    } finally {
        await db.end();
    }
}

migrate();
