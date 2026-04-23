const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupDatabase() {
  // Conectamos SIN especificar base de datos para poder crearla si no existe
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST?.includes('tidbcloud.com') ? { rejectUnauthorized: true } : false
  };

  const DB_NAME = process.env.DB_NAME || 'celuspapu';

  try {
    console.log('🔌 Conectando al engranaje base de MySQL/TiDB...');
    const db = await mysql.createConnection(connectionConfig);

    // Forzar la creación de la base de datos si no existe
    console.log(`🏗️  Creando base de datos '${DB_NAME}' si no existe...`);
    await db.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await db.query(`USE \`${DB_NAME}\`;`);
    console.log(`✅ Usando la base de datos: ${DB_NAME}`);

    console.log('🏗️  Diseñando la tabla "administradores" [Admin0 Supremo]...');
    // RNF05: Bypass temporal de integrity checks para migración estructural
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DROP TABLE IF EXISTS administradores');
    await db.execute(`
      CREATE TABLE administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT '/avatar1.png',
        es_supremo BOOLEAN DEFAULT FALSE
      )
    `);
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Inyectar Admin0
    const [rows] = await db.execute('SELECT * FROM administradores WHERE username = "admin0"');
    if (rows.length === 0) {
      console.log('🛡️ Inyectando Administrador Supremo (admin0)...');
      const hash = await bcrypt.hash('admin000', 10);
      await db.execute('INSERT INTO administradores (username, password, avatar, es_supremo) VALUES (?, ?, ?, ?)', 
        ['admin0', hash, '/logo1.jpg', true]);
    }

    console.log('👥  Diseñando la tabla de "usuarios" (Clientes VIP)...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT '/avatar1.png',
        direccion VARCHAR(255),
        ciudad VARCHAR(100),
        ultima_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('🏗️  Diseñando la tabla "comentarios" [RF04/RF06: Integridad en Cascada]...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NULL,
        usuario_id INT NULL,
        nombre VARCHAR(255) NOT NULL,
        modelo VARCHAR(255),
        estrellas INT,
        texto TEXT,
        fecha VARCHAR(50),
        avatar VARCHAR(255),
        FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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
      INSERT IGNORE INTO productos (id, nombre, marca, precio, especificaciones, imagen_url) VALUES 
      (1, 'iPhone 15 Pro Max', 'Apple', 1199.99, 'Chip A17 Pro, Titanium, Triple Cam 48MP', 'https://m.media-amazon.com/images/I/81Os1SDWpcL._AC_SX679_.jpg'),
      (2, 'ROG Strix Scar 18', 'ASUS', 2999.00, 'Intel i9 14th Gen, RTX 4090, 32GB DDR5', 'https://m.media-amazon.com/images/I/81xGsm67gCL._AC_SX679_.jpg'),
      (3, 'Katana 15', 'MSI', 1100.50, 'Intel i7, RTX 4060, 16GB RAM, 144Hz FHD', 'https://m.media-amazon.com/images/I/81rM5O0MmeL._AC_SX679_.jpg')
    `);

    // 2. REEMPLAZAR LA BÓVEDA DE PEDIDOS CON LA LLAVE FORÁNEA (SET NULL)
    console.log('📦  Diseñando la Bóveda de Pedidos [Conservación de Venta: SET NULL]...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total DECIMAL(10,2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'pendiente',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);

    console.log('📦  Diseñando los Detalles de los Pedidos (Facturación)...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS detalles_pedido (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_pedido INT NOT NULL,
        id_producto INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
      )
    `);

    // Actualización de robustez para bases de datos existentes que no tenían CASCADE o SET NULL
    console.log('🔧  Aplicando robustez de restricciones para bases de datos existentes...');
    try {
        // Aseguramos que COMENTARIOS sea CASCADE para usuario_id (Requerimiento Usuario)
        await db.execute('ALTER TABLE comentarios DROP FOREIGN KEY fk_comentario_usuario').catch(() => {});
        await db.execute('ALTER TABLE comentarios ADD CONSTRAINT fk_comentario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE').catch(() => {});
        
        // Aseguramos que PEDIDOS sea SET NULL para usuario_id (Requerimiento Histórico)
        await db.execute('ALTER TABLE pedidos DROP FOREIGN KEY fk_pedidos_usuario').catch(() => {});
        // Nota: A veces la FK de pedidos no tiene nombre explícito, usamos el estándar si aplica o ignoramos si falla
        await db.execute('ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL').catch(() => {});
    } catch (e) {
        console.log('⚠️  Nota: Algunas restricciones no pudieron re-aplicarse (posiblemente ya están configuradas correctamente).');
    }

    console.log('✅ ¡Arquitectura de Base de Datos Relacional inicializada con Éxito!');
    console.log('🔒 Resumen de Integridad: Comentarios -> CASCADE | Pedidos -> SET NULL.');
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico inicializando la base de datos:', error);
    process.exit(1);
  }
}

// Ejecución del Script de Robustez
setupDatabase().then(() => {
  console.log('✅ Migración y siembra completadas con éxito. Cerrando proceso setup...');
  process.exit(0);
}).catch(err => {
  console.error('🔥 Error fatal en la migración:', err);
  process.exit(1);
});
