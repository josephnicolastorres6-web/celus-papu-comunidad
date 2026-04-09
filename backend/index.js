const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

// Tu clave secreta para los tokens
const SECRET_KEY = 'cocacola03';

const app = express();

// ==========================================
// CONFIGURACIÓN DE CORS (Requerimiento B.1)
// ==========================================
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'celuspapu_db'
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos MySQL de XAMPP! 🗿🔌');
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
                // Incluimos el rol en la siembra si tu tabla tiene esa columna
                const insertQuery = 'INSERT INTO administradores (username, password, rol) VALUES (?, ?, ?)';
                db.query(insertQuery, ['admin', hashedPassword, 'admin'], (err, result) => {
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
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Por defecto, los nuevos registros son rol 'usuario'
        const insertQuery = 'INSERT INTO administradores (username, password, rol) VALUES (?, ?, ?)';
        
        db.query(insertQuery, [username, hashedPassword, 'usuario'], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al registrar el usuario' });
            res.status(201).json({ message: '¡Usuario creado con éxito! 🚀' });
        });
    } catch (error) {
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
// RUTAS DE ADMINISTRADORES
// ==========================================

app.post('/administradores', verificarToken, soloAdminSupremo, (req, res) => {
    const { username, password, rol } = req.body;
    const checkQuery = 'SELECT * FROM administradores WHERE username = ?';
    db.query(checkQuery, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la base de datos' });
        if (results.length > 0) return res.status(400).json({ error: 'Ese nombre de usuario ya existe' });

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const insertQuery = 'INSERT INTO administradores (username, password, rol) VALUES (?, ?, ?)';
            db.query(insertQuery, [username, hashedPassword, rol || 'usuario'], (err, result) => {
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
    const query = 'INSERT INTO comentarios (nombre, modelo, estrellas, texto, fecha, avatar) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [nombre, modelo, estrellas, texto, fecha, avatar], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear el comentario' });
        res.status(201).json({ id: result.insertId, ...req.body });
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

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});