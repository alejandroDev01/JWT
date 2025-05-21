const express = require('express');
const jwt = require('jsonwebtoken');
const base64url = require('base64url');

const app = express();
app.use(express.json());

// Función para generar el formato específico del header
function generateCustomHeader(phoneNumber) {
    // Convertir el número de teléfono a un formato específico
    return 'I' + base64url(phoneNumber);
}

// Endpoint para generar JWT
app.post('/api/login', (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            message: "El número de teléfono es requerido"
        });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    try {
        // Generar las partes del token
        const header = generateCustomHeader(phoneNumber);
        const payload = Buffer.from(timestamp.toString()).toString('base64url');
        
        // Generar firma
        const signature = jwt.sign(
            { timestamp }, 
            timestamp.toString(), 
            { algorithm: 'HS256' }
        ).split('.')[2];

        // Construir el token en el formato deseado
        const token = `${header}.${payload}.${signature}`;

        res.json({
            success: true,
            token: token,
            timestamp: timestamp
        });
    } catch (error) {
        console.error('Error al generar el token:', error);
        res.status(500).json({
            success: false,
            message: "Error al generar el token"
        });
    }
});

// Función para decodificar el token personalizado
function decodeCustomToken(token) {
    const [header, payload, signature] = token.split('.');
    
    // Decodificar el número de teléfono del header (removiendo el 'I' inicial)
    const phoneNumber = base64url.decode(header.substring(1));
    
    // Decodificar el timestamp del payload
    const timestamp = base64url.decode(payload);

    return {
        phoneNumber,
        timestamp
    };
}

// Endpoint protegido
app.get('/api/protected', (req, res) => {
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
        return res.status(401).json({
            success: false,
            message: "Token no proporcionado"
        });
    }

    const token = bearerHeader.split(' ')[1];
    
    try {
        const decoded = decodeCustomToken(token);
        
        // Verificar la firma usando el timestamp decodificado
        const [header, payload, signature] = token.split('.');
        const expectedToken = jwt.sign(
            { timestamp: decoded.timestamp }, 
            decoded.timestamp, 
            { algorithm: 'HS256' }
        );
        
        const expectedSignature = expectedToken.split('.')[2];
        
        if (signature !== expectedSignature) {
            throw new Error('Firma inválida');
        }

        res.json({
            success: true,
            message: "Acceso permitido",
            userData: {
                phoneNumber: decoded.phoneNumber,
                timestamp: decoded.timestamp
            }
        });
    } catch (error) {
        res.status(403).json({
            success: false,
            message: "Token inválido"
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});