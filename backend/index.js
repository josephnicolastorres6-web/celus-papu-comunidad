const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Tu clave secreta para los tokens
const SECRET_KEY = process.env.JWT_SECRET || 'cocacola03';

const app = express();

// ==========================================
// CONFIGURACIÓN DE CORS (Requerimiento B.1)
// ==========================================
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Manejo manual de preflight para evitar crash en Express v5
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// ==========================================
// Configuración de la conexión a MySQL (Actualizado para la nube y local)
// ==========================================
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'celuspapu_db',
    port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos MySQL! 🗿🔌');
});

// ==========================================
// SIEMBRA AUTOMÁTICA (AUTO-SEEDING)
// ==========================================
const inicializarAdmin = () => {
    const checkQuery = 'SELECT * FROM administradores WHERE username = "admin"';
    db.query(checkQuery, async (err, results) => {
        if (err) return console.error('Error verificando administradores:', err);

        if (results.length === 0) {
            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);
                // Removido 'rol' porque la tabla MySQL no tiene esa columna
                const insertQuery = 'INSERT INTO administradores (username, password) VALUES (?, ?)';
                db.query(insertQuery, ['admin', hashedPassword], (err, result) => {
                    if (!err) console.log('🛡️ Siembra Automática: Administrador inicial (admin) creado exitosamente.');
                });
            } catch (error) {
                console.error('Error encriptando la contraseña:', error);
            }
        } else {
            console.log('🛡️ El administrador por defecto ya existe en la base de datos.');
        }
    });
};
inicializarAdmin();

// ==========================================
// ENDPOINT DE REGISTRO
// ==========================================
app.post('/registro', async (req, res) => {
    const { username, password } = req.body;

    // Validación para evitar crasheos si el body llega vacío
    if (!username || !password) {
        console.error('❌ Error crítico en registro: Faltan credenciales en la petición (username o password vacíos).', req.body);
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // La base de datos no tiene columna rol, insertamos solo credenciales
        const insertQuery = 'INSERT INTO administradores (username, password) VALUES (?, ?)';
        
        db.query(insertQuery, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('❌ Error crítico en registro (Base de datos MySQL):', err);
                return res.status(500).json({ error: 'Error al registrar el usuario en MySQL' });
            }
            res.status(201).json({ message: '¡Usuario creado con éxito! 🚀' });
        });
    } catch (error) {
        console.error('❌ Error crítico en registro (Procesamiento/Bcrypt):', error);
        res.status(500).json({ error: 'Error al procesar el registro' });
    }
});

// ==========================================
// ENDPOINT DE LOGIN (A.1) - ACTUALIZADO PARA ANGULAR
// ==========================================
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM administradores WHERE username = ?';
    
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos' });
        if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

        const admin = results[0];
        const passwordValida = await bcrypt.compare(password, admin.password);

        if (!passwordValida) return res.status(401).json({ error: 'Contraseña incorrecta' });

        // Guardamos el rol en el token
        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.rol || 'usuario' }, 
            SECRET_KEY, 
            { expiresIn: '2h' }
        );

        // Enviamos el token Y el rol al frontend
        res.json({ 
            message: 'Login exitoso', 
            token: token,
            role: admin.rol || 'usuario' 
        });
    });
});

// ==========================================
// MIDDLEWARES DE SEGURIDAD
// ==========================================
const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ error: '¡Alto ahí! Acceso denegado. Necesitas iniciar sesión.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    try {
        const verificado = jwt.verify(token, SECRET_KEY);
        req.admin = verificado; 
        next();
    } catch (error) {
        res.status(401).json({ error: 'Tu sesión es inválida o ya expiró.' });
    }
};

const soloAdminSupremo = (req, res, next) => {
    // Verificamos si es el usuario 'admin' o si tiene el rol 'admin'
    if (req.admin.username !== 'admin' && req.admin.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos de Jefe. Solo el Admin Supremo puede hacer esto.' });
    }
    next();
};

// ==========================================
// RUTAS DE ADMINISTRADORES / DASHBOARD
// ==========================================

// GET: Listar todos los usuarios para el Dashboard
app.get('/usuarios', verificarToken, (req, res) => {
    const query = 'SELECT id, username, avatar FROM administradores ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
        
        // Mapeamos los resultados para emparejar la estructura que espera tu Dashboard de Angular
        const usuariosFormateados = results.map(u => ({
            id: u.id,
            nombre: u.username,
            avatar: u.avatar || 'assets/avatars/avatar1.svg', // Fallback anti-crasheo
            rol: 'Usuario', // Simulamos el rol ya que lo eliminamos de la BD
            fecha: new Date().toISOString().split('T')[0] // Fecha simulada temporal
        }));
        
        res.json(usuariosFormateados);
    });
});

// PUT: Actualizar usuario (RF05: Actualizar nombre y avatar)
app.put('/usuarios/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { username, avatar } = req.body;
    try {
        const updateQuery = 'UPDATE administradores SET username = ?, avatar = ? WHERE id = ?';
        db.query(updateQuery, [username, avatar, id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar usuario' });
            res.json({ message: 'Usuario actualizado exitosamente' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// DELETE: Eliminar un usuario desde el Dashboard
app.delete('/usuarios/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM administradores WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar usuario' });
        res.json({ message: 'Usuario eliminado exitosamente' });
    });
});

app.post('/administradores', verificarToken, soloAdminSupremo, (req, res) => {
    const { username, password, rol } = req.body;
    const checkQuery = 'SELECT * FROM administradores WHERE username = ?';
    db.query(checkQuery, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos' });
        if (results.length > 0) return res.status(400).json({ error: 'Ese nombre de usuario ya existe' });

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // RF03: Permitiendo inyección de avatar en creación
            const avatarInyectado = req.body.avatar || 'assets/avatars/avatar1.svg';
            const insertQuery = 'INSERT INTO administradores (username, password, avatar) VALUES (?, ?, ?)';
            db.query(insertQuery, [username, hashedPassword, avatarInyectado], (err, result) => {
                if (err) return res.status(500).json({ error: 'Error al crear el administrador' });
                res.status(201).json({ message: 'Nuevo administrador creado con éxito', id: result.insertId });
            });
        } catch (error) {
            res.status(500).json({ error: 'Error al procesar la contraseña' });
        }
    });
});

// ==========================================
// ENDPOINTS DE COMENTARIOS / RESEÑAS
// ==========================================

app.get('/comentarios', (req, res) => {
    const query = 'SELECT * FROM comentarios ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener los comentarios' });
        res.json(results);
    });
});

app.post('/comentarios', verificarToken, soloAdminSupremo, (req, res) => {
    const { nombre, modelo, estrellas, texto, fecha, avatar } = req.body;
    
    // RF06: Vinculamos la tarea con el usuario autenticado
    const admin_id = req.admin.id; 

    // Guardar referencia en vez de saltarla
    const query = 'INSERT INTO comentarios (admin_id, nombre, modelo, estrellas, texto, fecha, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [admin_id, nombre, modelo, estrellas, texto, fecha, avatar], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error de integridad creando la tarea vinculada' });
        res.status(201).json({ id: result.insertId, admin_id, ...req.body });
    });
});

app.delete('/comentarios/:id', verificarToken, soloAdminSupremo, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM comentarios WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar el comentario' });
        res.json({ message: 'Comentario eliminado exitosamente' });
    });
});

// ==========================================
// Iniciar el servidor (Actualizado para el puerto dinámico de Railway)
// ==========================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT} (0.0.0.0)`);
});