const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const zlib = require("zlib");

let tokens = [];
const PORT = process.env.PORT || 3001;
const SERVER_URL = "https://dashboard-gray-zeta-28.vercel.app/api/token";

console.log(`Iniciando servicio en puerto: ${PORT}`);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

function extraerToken(mensaje) {
  const tokenRegex = /https:\/\/sistemadevotacion22025.*?token=([^\s]+)/;
  const match = mensaje.match(tokenRegex);
  console.log(match);
  return match ? match[1] : null;
}

function decodificarToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = Buffer.from(payload, "base64");

    const decompressed = zlib.unzipSync(decoded);
    const datos = JSON.parse(decompressed.toString("utf-8"));
    console.log(datos);
    return datos;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
}

async function enviarTokens() {
  if (tokens.length > 0) {
    try {
      const response = await axios.post(
        SERVER_URL,
        { tokens },
        { timeout: 5000 }
      );
      console.log("Datos enviados exitosamente:", response.data);
      tokens = [];
    } catch (error) {
      console.error(
        "Error al enviar datos:",
        error.response?.data || error.message
      );
    }
  }
}

client.on("qr", (qr) => {
  console.log("Escanea el siguiente código QR:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("¡Cliente de WhatsApp Web conectado y listo!");
});

client.on("message", async (msg) => {
  console.log("Mensaje recibido:", msg.body);

  if (msg.body.includes("Primarias Bolivia 2025")) {
    console.log("Mensaje de votación detectado");
    const tokenCompleto = extraerToken(msg.body);

    if (tokenCompleto) {
      console.log("Token detectado:", tokenCompleto);

      const datosDecodificados = decodificarToken(tokenCompleto);

      if (datosDecodificados) {
        tokens.push({
          ...datosDecodificados,
          token: tokenCompleto,
        });

        console.log("Datos almacenados:", {
          numero: datosDecodificados.numero,
          dominio: datosDecodificados.dominio,
          remitente: msg.from,
        });

        await enviarTokens();
      }
    }
  }
});

// Manejo de errores
client.on("auth_failure", (error) => {
  console.error("Error de autenticación:", error);
});

client.on("disconnected", (reason) => {
  console.log("Cliente desconectado:", reason);
});

client.initialize();
