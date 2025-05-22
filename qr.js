const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

let tokens = [];

const PORT = process.env.PORT || 3001;

const SERVER_URL = 'http://192.168.104.217:3001/api/token';
// const SERVER_URL = 'http://dashboard.pasantia.com/api/token';
console.log(`Iniciando servicio en puerto: ${PORT}`);
console.log('Tokens almacenados:', tokens);
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

function extraerToken(mensaje) {
    const urlRegex = /https:\/\/sistemadevotacion2025.*?token=(.*?)(?:\s|$)/;
    const match = mensaje.match(urlRegex);
    return match ? match[1] : null;
}


async function enviarTokens() {
    if (tokens.length >= 10) {
        try {
            const tokensSoloValores = tokens.map(t => t.token);
            const response = await axios.post(SERVER_URL, { tokens: tokensSoloValores });
            console.log('Tokens enviados exitosamente:', response.data);
            // Limpiar el array después de enviar
            tokens = [];
        } catch (error) {
            console.error('Error al enviar tokens:', error);
        }
    }
}

client.on('qr', qr => {
    console.log('Escanea el siguiente código QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('¡Cliente de WhatsApp Web conectado y listo!');
});

client.on('authenticated', (session) => {
    console.log('¡Autenticación exitosa!');
});

client.on('message', async msg => {
    console.log('Mensaje recibido:', msg.body);
    const lowerCaseMsg = msg.body.toLowerCase();

    if (msg.body.includes('Participa en las *Primarias Bolivia 2025*')) {
        const token = extraerToken(msg.body);
        if (token) {
            console.log('Token detectado:', token);
            tokens.push({
                token: token,
                timestamp: new Date().toISOString(),
                remitente: msg.from
            });
            
            console.log('Token almacenado. Total tokens:', tokens.length);
            await enviarTokens();
        }
    } 
});

client.on('auth_failure', (error) => {
    console.error('Error de autenticación:', error);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
});

client.initialize();