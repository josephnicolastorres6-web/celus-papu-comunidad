// ==========================================
// ESCUDO ANTI-CRASH GLOBAL (PRIMERA LÍNEA)
// ==========================================
process.on('uncaughtException', err => console.error('🔥 CRASH FATAL NO CAPTURADO:', err));
process.on('unhandledRejection', err => console.error('🔥 PROMESA RECHAZADA:', err));

require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Tu clave secreta para los tokens
const SECRET_KEY = process.env.JWT_SECRET || 'cocacola03';

const app = express();

// 1. EL ESCUDO CORS DEBE SER LO PRIMERO EN EL CÓDIGO
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. PARSEO DE JSON
app.use(express.json());

// 3. RUTA DE SALUD (Health Check para Railway)
app.get('/', (req, res) => {
    const dbStatus = db ? '🔌 DB Configurada' : '⚠️ DB Pendiente';
    res.status(200).send(`🚀 API Celus Papu - Online | Status: ${dbStatus}`);
});

// ==========================================
// 🚀 PROTOCOLO AUTO-HEALING ROBUSTO
// ==========================================
let db;

async function inicializarInfraestructura() {
    const DB_NAME = process.env.DB_NAME || 'celuspapu';
    console.log('🏗️ Iniciando Auto-Healing para BD:', DB_NAME);

    const connConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT) || 3306
    };
    // SSL solo para TiDB Cloud
    if (process.env.DB_HOST?.includes('tidbcloud.com')) {
        connConfig.ssl = { rejectUnauthorized: true };
    }

    const mysql2p = require('mysql2/promise');

    // PASO 1: Crear la BD si no existe (conexión sin DB)
    try {
        const tempConn = await mysql2p.createConnection(connConfig);
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
        console.log('✅ BD', DB_NAME, 'verificada/creada.');
        await tempConn.end();
    } catch (e) {
        // En TiDB Cloud a veces la BD ya existe y no necesita crearse
        if (e.code !== 'ER_DB_CREATE_EXISTS') {
            console.warn('⚠️ No se pudo crear la BD (puede que ya exista o sin permisos):', e.message);
        }
    }

    // PASO 2: Crear el pool apuntando ya a la BD
    db = require('mysql2').createPool({
        ...connConfig,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('🔌 Pool de conexiones principal listo.');

    // PASO 3: Crear tablas y semillas usando el pool (RESET TOTAL PARA ESTABILIDAD)
    const pdb = db.promise();
    try {
        await pdb.query('SET FOREIGN_KEY_CHECKS = 0');
        
        console.log('🧹 Limpiando tablas para reconstrucción de esquema...');
        await pdb.query('DROP TABLE IF EXISTS comentarios');
        await pdb.query('DROP TABLE IF EXISTS usuarios');
        await pdb.query('DROP TABLE IF EXISTS administradores');
        
        console.log('🏗️ Recreando tabla administradores...');
        await pdb.query(`
            CREATE TABLE administradores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                avatar VARCHAR(255) DEFAULT '/logo1.jpg',
                es_supremo BOOLEAN DEFAULT FALSE,
                rol VARCHAR(50) DEFAULT 'admin'
            )
        `);

        console.log('🏗️ Recreando tabla usuarios...');
        await pdb.query(`
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                avatar VARCHAR(255) DEFAULT '/avatar1.png',
                nombre VARCHAR(255) NULL,
                direccion VARCHAR(255),
                ciudad VARCHAR(100),
                ultima_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('🏗️ Recreando tabla comentarios...');
        await pdb.query(`
            CREATE TABLE comentarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NULL,
                usuario_id INT NULL,
                nombre VARCHAR(255) NOT NULL DEFAULT '',
                modelo VARCHAR(255),
                estrellas INT,
                texto TEXT,
                fecha VARCHAR(50),
                avatar VARCHAR(255),
                FOREIGN KEY (admin_id) REFERENCES administradores(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `);
        
        await pdb.query('SET FOREIGN_KEY_CHECKS = 1');

        await pdb.query('SET FOREIGN_KEY_CHECKS = 1');

        // PASO 4: Inyectar Admin Supremo garantizado
        const hash = await bcrypt.hash('admin000', 10);
        await pdb.query(
            `INSERT IGNORE INTO administradores (username, password, avatar, es_supremo) VALUES ('admin0', ?, '/logo1.jpg', true)`,
            [hash]
        );
        console.log('✅ Infraestructura lista. Admin0 garantizado.');
    } catch (e) {
        console.error('🔥 Error en creación de tablas (el servidor sigue activo):', e.message);
    }
}

// ==========================================
// REGISTRO DE ADMINISTRADORES
// ==========================================
app.post('/api/admin/registrar', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y contraseña son obligatorios' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const insertQuery = 'INSERT INTO administradores (username, password) VALUES (?, ?)';
        
        db.query(insertQuery, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('❌ Error crítico en registro admin:', err);
                return res.status(500).json({ error: 'Error al registrar el administrador' });
            }
            res.status(201).json({ message: '¡Administrador creado con éxito! 🚀' });
        });
    } catch (error) {
        console.error('❌ Error al procesar registro admin:', error);
        res.status(500).json({ error: 'Error interno en el registro' });
    }
});

// ==========================================
// ENDPOINT DE LOGIN ADMIN (Independiente)
// ==========================================
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`🛡️ Intento de acceso administrativo para: ${username}`);
    const query = 'SELECT * FROM administradores WHERE username = ?';
    
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos de administración' });
        if (results.length === 0) return res.status(401).json({ error: 'Acceso denegado: El administrador no existe' });

        const admin = results[0];
        const passwordValida = await bcrypt.compare(password, admin.password);

        if (!passwordValida) return res.status(401).json({ error: 'Contraseña administrativa incorrecta' });

        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.rol || 'usuario' }, 
            SECRET_KEY, 
            { expiresIn: '2h' }
        );

        res.json({ 
            message: 'Inicio de sesión exitoso', 
            token: token,
            role: 'admin' 
        });
    });
});

// ==========================================
// MÓDULO DE CLIENTES (REGISTRO Y LOGIN)
// ==========================================
app.post('/api/usuarios/registro', async (req, res) => {
    const { username, password, avatar } = req.body;
    console.log(`📝 Intento de registro: username="${username}"`);
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y contraseña son obligatorios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const avatarDefault = avatar || '/avatar1.png';
        const emailDummy = `${username.toLowerCase().replace(/\s/g, '')}@celuspapu.com`;

        const query = 'INSERT INTO usuarios (username, email, password, avatar) VALUES (?, ?, ?, ?)';
        db.query(query, [username, emailDummy, hashedPassword, avatarDefault], (err, result) => {
            if (err) {
                console.error('🔥 ERROR CRÍTICO EN /api/usuarios/registro:', {
                    code: err.code,
                    sqlMessage: err.sqlMessage,
                    sql: err.sql,
                    mensaje: err.message
                });
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Este nombre de usuario ya está en uso.' });
                }
                return res.status(500).json({ 
                    error: 'Error al registrar el cliente.', 
                    detalle: err.sqlMessage || err.message 
                });
            }
            console.log(`✅ Usuario registrado: ${username} (id=${result.insertId})`);
            res.status(201).json({ message: 'Registro de cliente exitoso.', id: result.insertId });
        });
    } catch (e) {
        console.error('🔥 ERROR CRÍTICO EN /api/usuarios/registro (catch):', e);
        res.status(500).json({ error: 'Error interno del servidor.', detalle: e.message });
    }
});

app.post('/api/usuarios/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`🔑 Intento de login para usuario: ${username}`);
    const query = 'SELECT * FROM usuarios WHERE username = ?';

    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos de usuarios.' });
        if (results.length === 0) return res.status(401).json({ error: 'El nombre de usuario no existe.' });

        const usuario = results[0];
        const valida = await bcrypt.compare(password, usuario.password);
        if (!valida) return res.status(401).json({ error: 'Contraseña de cliente incorrecta.' });

        const token = jwt.sign(
            { id: usuario.id, username: usuario.username, email: usuario.email, avatar: usuario.avatar, role: 'cliente' },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        db.query('UPDATE usuarios SET ultima_conexion = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

        res.json({ 
            message: '¡Bienvenido a Celus Papu!', 
            token, 
            nombre: usuario.username,
            avatar: usuario.avatar
        });
    });
});

// ==========================================
// MIDDLEWARES DE SEGURIDAD
// ==========================================
const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: '¡Acceso denegado! Necesitas una sesión activa.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    try {
        const verificado = jwt.verify(token, SECRET_KEY);
        req.user = verificado; 
        next();
    } catch (error) {
        res.status(401).json({ error: 'Tu sesión ha expirado o es inválida.' });
    }
};

const soloAdminSupremo = (req, res, next) => {
    if (req.user.username !== 'admin0' && req.user.username !== 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permisos insuficientes. Solo el Administrador principal puede realizar esta acción.' });
    }
    next();
};

// ==========================================
// RUTAS DE ADMINISTRADORES / DASHBOARD
// ==========================================

app.get('/usuarios', verificarToken, (req, res) => {
    const query = 'SELECT id, username, avatar FROM administradores ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
        
        const usuariosFormateados = results.map(u => ({
            id: u.id,
            nombre: u.username,
            avatar: u.avatar || '/avatar2.png',
            rol: 'Administrador',
            fecha: new Date().toISOString().split('T')[0]
        }));
        
        res.json(usuariosFormateados);
    });
});

app.put('/usuarios/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { username, avatar } = req.body;
    try {
        const updateQuery = 'UPDATE administradores SET username = ?, avatar = ? WHERE id = ?';
        db.query(updateQuery, [username, avatar, id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar el usuario' });
            res.json({ message: 'Usuario actualizado correctamente' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno al intentar actualizar' });
    }
});

app.delete('/usuarios/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    
    // Proteger Admin Supremo de ser eliminado
    const checkQuery = 'SELECT es_supremo FROM administradores WHERE id = ?';
    db.query(checkQuery, [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al verificar jerarquía.' });
        
        if (results.length > 0 && results[0].es_supremo) {
            return res.status(403).json({ error: '¡Acceso Denegado! No puedes eliminar al Administrador Supremo.' });
        }
        
        const deleteQuery = 'DELETE FROM administradores WHERE id = ?';
        db.query(deleteQuery, [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al eliminar la cuenta.' });
            res.json({ message: 'Cuenta administradores eliminada con éxito.' });
        });
    });
});

// ==========================================
// CRUD ADMINISTRATIVO DE CLIENTES (USUARIOS)
// ==========================================

app.get('/admin/usuarios', verificarToken, (req, res) => {
    const query = 'SELECT id, nombre, email, avatar, direccion, ciudad FROM usuarios ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener la lista de clientes registrados.' });
        res.json(results);
    });
});

app.post('/admin/usuarios', verificarToken, async (req, res) => {
    const { nombre, email, avatar } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('papu123456', salt);
        const query = 'INSERT INTO usuarios (nombre, email, password, avatar) VALUES (?, ?, ?, ?)';
        
        db.query(query, [nombre, email, hashedPassword, avatar || '/avatar1.png'], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al crear el cliente de forma manual.' });
            res.status(201).json({ id: result.insertId, nombre, email, avatar: avatar || '/avatar1.png' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Error interno al procesar el alta de cliente.' });
    }
});

app.put('/admin/usuarios/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { nombre, avatar } = req.body;
    const query = 'UPDATE usuarios SET nombre = ?, avatar = ? WHERE id = ?';
    db.query(query, [nombre, avatar, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar los datos del cliente.' });
        res.json({ message: 'Perfil de cliente actualizado con éxito.' });
    });
});

app.delete('/admin/usuarios/:id', verificarToken, soloAdminSupremo, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM usuarios WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar al cliente de la base de datos.' });
        res.json({ message: 'Cliente eliminado definitivamente.' });
    });
});

app.post('/api/admin/registrar', verificarToken, soloAdminSupremo, async (req, res) => {
    const { username, password, avatar } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos obligatorios para el registro.' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const insertQuery = 'INSERT INTO administradores (username, password, avatar) VALUES (?, ?, ?)';
        db.query(insertQuery, [username, hashedPassword, avatar || '/avatar2.png'], (err) => {
            if (err) return res.status(500).json({ error: 'Error al registrar el nuevo administrador.' });
            res.status(201).json({ message: 'Nuevo administrador registrado con éxito.' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Error interno del sistema.' });
    }
});

app.put('/api/usuario/perfil', verificarToken, (req, res) => {
    const { nombre, avatar } = req.body;
    const id = req.user.id;
    const isClient = req.user.role === 'cliente';

    if (isClient) {
        const query = 'UPDATE usuarios SET nombre = ?, avatar = ? WHERE id = ?';
        db.query(query, [nombre, avatar, id], (err) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar tu perfil personal.' });
            res.json({ message: 'Perfil actualizado correctamente.' });
        });
    } else {
        const query = 'UPDATE administradores SET username = ?, avatar = ? WHERE id = ?';
        db.query(query, [nombre, avatar, id], (err) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar el perfil de administrador.' });
            res.json({ message: 'Perfil administrativo actualizado.' });
        });
    }
});

app.get('/api/miembros', (req, res) => {
    const query = `
        SELECT id, username, avatar, ultima_conexion, 'cliente' as rol FROM usuarios
        UNION
        SELECT id, username, avatar, NULL as ultima_conexion, 'admin' as rol FROM administradores
        ORDER BY ultima_conexion DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener la lista de miembros.' });
        res.json(results);
    });
});

app.post('/administradores', verificarToken, soloAdminSupremo, (req, res) => {
    const { username, password, rol } = req.body;
    const checkQuery = 'SELECT * FROM administradores WHERE username = ?';
    db.query(checkQuery, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al verificar disponibilidad de usuario.' });
        if (results.length > 0) return res.status(400).json({ error: 'El nombre de usuario ya se encuentra registrado.' });

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const avatarInyectado = req.body.avatar || '/avatar2.png';
            const insertQuery = 'INSERT INTO administradores (username, password, avatar) VALUES (?, ?, ?)';
            db.query(insertQuery, [username, hashedPassword, avatarInyectado], (err, result) => {
                if (err) return res.status(500).json({ error: 'Error al crear el nuevo administrador.' });
                res.status(201).json({ message: 'Administrador creado con éxito.', id: result.insertId });
            });
        } catch (error) {
            res.status(500).json({ error: 'Error interno al procesar la seguridad de la cuenta.' });
        }
    });
});

// ==========================================
// ENDPOINTS DE COMENTARIOS / RESEÑAS
// ==========================================

app.get('/comentarios', verificarToken, (req, res) => {
    const isClient = req.user.role === 'cliente';
    const userId = req.user.id;

    let query = `
      SELECT c.id, c.texto, c.fecha, c.estrellas, 
             COALESCE(a.username, u.username) as username, 
             COALESCE(a.avatar, u.avatar) as avatar,
             c.modelo, c.usuario_id
      FROM comentarios c 
      LEFT JOIN administradores a ON c.admin_id = a.id 
      LEFT JOIN usuarios u ON c.usuario_id = u.id
    `;

    if (isClient) {
        query += ` WHERE c.usuario_id = ${userId}`;
    }

    query += ` ORDER BY c.id DESC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error JOIN muro:', err);
            return res.status(500).json({ error: 'Error al obtener los comentarios de la comunidad' });
        }
        res.json(results);
    });
});

app.post('/comentarios', verificarToken, (req, res) => {
    const { texto, estrellas, modelo, avatar, nombre } = req.body;
    const role = req.user.role;
    const userId = req.user.id;

    const fecha = new Date().toLocaleString();
    let query, params;

    if (role === 'admin') {
        query = 'INSERT INTO comentarios (admin_id, nombre, modelo, estrellas, texto, fecha, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)';
        params = [userId, nombre, modelo, estrellas, texto, fecha, avatar];
    } else {
        query = 'INSERT INTO comentarios (usuario_id, nombre, modelo, estrellas, texto, fecha, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)';
        params = [userId, nombre, modelo, estrellas, texto, fecha, avatar];
    }

    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al enviar tu comentario al servidor.' });
        res.status(201).json({ id: result.insertId, message: '¡Tu mensaje ha sido publicado!' });
    });
});

app.delete('/comentarios/:id', verificarToken, soloAdminSupremo, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM comentarios WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al intentar eliminar el comentario.' });
        res.json({ message: 'Comentario eliminado exitosamente.' });
    });
});

// ==========================================
// CATÁLOGO DE PRODUCTOS (RF: ALTA GAMA)
// ==========================================
app.get('/productos', (req, res) => {
    const query = 'SELECT * FROM productos ORDER BY id ASC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener el catálogo de productos.' });
        res.json(results);
    });
});

app.get('/productos/:id', (req, res) => {
    const query = 'SELECT * FROM productos WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener los detalles del producto.' });
        if (results.length === 0) return res.status(404).json({ error: 'El producto solicitado no existe.' });
        res.json(results[0]);
    });
});

// ==========================================
// MÓDULO DE PEDIDOS (CARRITO)
// ==========================================
app.post('/pedidos', verificarToken, (req, res) => {
    const { total, items } = req.body;
    const usuario_id = req.user && req.user.role === 'cliente' ? req.user.id : null;
    
    db.query("INSERT INTO pedidos (total, estado, usuario_id) VALUES (?, 'pendiente', ?)", [total, usuario_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar la orden de pedido.' });
        
        const id_pedido = result.insertId;
        
        if (items && items.length > 0) {
            let completados = 0;
            let huboError = false;
            
            items.forEach(item => {
                db.query('INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)', 
                [id_pedido, item.id, item.cantidad, item.precio], (errDetalle) => {
                    if (errDetalle) huboError = true;
                    completados++;
                    if (completados === items.length) {
                        if (huboError) return res.status(500).json({ error: 'La orden fue creada pero algunos detalles no pudieron guardarse.' });
                        return res.status(201).json({ id_pedido });
                    }
                });
            });
        } else {
            return res.status(201).json({ id_pedido });
        }
    });
});

// ==========================================
// TABLERO DE COMANDO ADMIN (TABLA DE GESTIÓN)
// ==========================================
app.get('/admin/pedidos', verificarToken, (req, res) => {
    const query = `
      SELECT p.id as pedido_id, p.fecha, p.total, p.estado,
             d.cantidad, d.precio_unitario,
             pr.nombre as producto_nombre
      FROM pedidos p
      LEFT JOIN detalles_pedido d ON p.id = d.id_pedido
      LEFT JOIN productos pr ON d.id_producto = pr.id
      ORDER BY p.fecha DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener el tablero de pedidos.' });
        
        const map = new Map();
        results.forEach(row => {
            if (!map.has(row.pedido_id)) {
                map.set(row.pedido_id, {
                    id: row.pedido_id,
                    fecha: row.fecha,
                    total: row.total,
                    estado: row.estado,
                    expanded: false,
                    productos: []
                });
            }
            if (row.producto_nombre) {
                map.get(row.pedido_id).productos.push({
                    nombre: row.producto_nombre,
                    cantidad: row.cantidad,
                    precio: row.precio_unitario
                });
            }
        });
        
        res.json(Array.from(map.values()));
    });
});

app.patch('/pedidos/:id/estado', verificarToken, (req, res) => {
    const { estado } = req.body;
    const query = 'UPDATE pedidos SET estado = ? WHERE id = ?';
    db.query(query, [estado, req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar el estado del pedido.' });
        res.json({ message: 'Estado del pedido actualizado correctamente.' });
    });
});

// ==========================================
// 5. APERTURA DE PUERTO A PRUEBA DE FALLOS Y AUTO-HEALING
// ==========================================
const PORT = process.env.PORT || 3000;
inicializarInfraestructura().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
    }).on('error', (err) => {
        console.error('🔥 Error crítico al iniciar el servidor:', err);
    });
});