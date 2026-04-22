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

    console.log('🛡️  MODO PRODUCCIÓN: Conservando datos existentes (Sin DROP TABLES)...');
    
    console.log('🏗️  Diseñando la tabla "administradores" [RF03: Preparación Avatar]...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT 'assets/avatars/avatar1.svg'
      )
    `);

    console.log('🏗️  Diseñando la tabla "comentarios" [RF04/RF06: Integridad Referencial y Cascade]...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS comentarios (
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

    console.log('📦  Diseñando tabla de "productos" [Catálogo de Alta Gama]...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        marca VARCHAR(100),
        precio DECIMAL(10,2),
        especificaciones TEXT,
        imagen_url VARCHAR(255)
      )
    `);

    console.log('💎  Inyectando productos premium de catálogo por defecto...');
    await db.execute(`
      INSERT INTO productos (nombre, marca, precio, especificaciones, imagen_url) VALUES 
      ('iPhone 15 Pro Max', 'Apple', 1199.99, 'Chip A17 Pro, Titanium, Triple Cam 48MP', 'https://m.media-amazon.com/images/I/81Os1SDWpcL._AC_SX679_.jpg'),
      ('ROG Strix Scar 18', 'ASUS', 2999.00, 'Intel i9 14th Gen, RTX 4090, 32GB DDR5', 'https://m.media-amazon.com/images/I/81xGsm67gCL._AC_SX679_.jpg'),
      ('Katana 15', 'MSI', 1100.50, 'Intel i7, RTX 4060, 16GB RAM, 144Hz FHD', 'https://m.media-amazon.com/images/I/81rM5O0MmeL._AC_SX679_.jpg')
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
