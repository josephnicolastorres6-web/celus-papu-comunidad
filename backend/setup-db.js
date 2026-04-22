const mysql = require('mysql2/promise');
require('dotenv').config(); // Asegurarse de leer .env u variables de sistema en Railway

async function setupDatabase() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'celuspapu_db',
    port: process.env.DB_PORT || 3306
  };

  try {
    console.log('🔌 Conectando al engranaje base de MySQL...');
    const db = await mysql.createConnection(connectionConfig);

    console.log('🗑️  Limpiando arquitectura antigua para evitar choques estructurales...');
    await db.execute('DROP TABLE IF EXISTS comentarios');
    await db.execute('DROP TABLE IF EXISTS administradores');

    console.log('🏗️  Diseñando la tabla "administradores" [RF03: Preparación Avatar]...');
    await db.execute(`
      CREATE TABLE administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT 'assets/avatars/avatar1.svg'
      )
    `);

    console.log('🏗️  Diseñando la tabla "comentarios" [RF04/RF06: Integridad Referencial y Cascade]...');
    await db.execute(`
      CREATE TABLE comentarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        modelo VARCHAR(255),
        estrellas INT,
        texto TEXT,
        fecha VARCHAR(50),
        avatar VARCHAR(255),
        FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ ¡Arquitectura de Base de Datos Relacional inicializada con Éxito!');
    console.log('🔒 La Eliminación en Cascada (ON DELETE CASCADE) está activa y protegiendo tus esquemas.');
    
    // Cerramos la conexión para que el script pueda finalizar
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico inicializando la base de datos:', error);
    process.exit(1);
  }
}

setupDatabase();
