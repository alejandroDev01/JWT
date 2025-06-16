const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const zlib = require("zlib");

let tokens = [];
const PORT = process.env.PORT || 3001;
const SERVER_URL = "http://190.181.22.187:3001/api/token";

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
  const tokenRegex = /token=([a-zA-Z0-9.\-_]+)/;
  const match = mensaje.match(tokenRegex);
  return match ? match[1] : null;
}

function decodificarToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = Buffer.from(payload, "base64");

    let decompressed;
    try {
      decompressed = zlib.unzipSync(decoded);
    } catch (zipError) {
      console.warn(
        "Token no comprimido, usando base64 decodificado directamente."
      );
      decompressed = decoded;
    }

    const datos = JSON.parse(decompressed.toString("utf-8"));

    if (!datos.numero || !datos.dominio) {
      throw new Error("Datos incompletos en el token decodificado");
    }

    return datos;
  } catch (error) {
    console.error("❌ Error al decodificar token:", error.message);
    return null;
  }
}

async function enviarTokens() {
  if (tokens.length > 10) {
    try {
      const payload = {
        tokens: tokens.map((t) => ({
          token: t.token,
          numero: t.numero,
          dominio: t.dominio,
        })),
      };

      console.log(
        "🚀 Enviando datos a la API:",
        JSON.stringify(payload, null, 2)
      );

      const response = await axios.post(SERVER_URL, payload, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Datos enviados exitosamente:", response.data);
      tokens = [];
    } catch (error) {
      console.error(
        "❌ Error al enviar datos:",
        error.response
          ? { status: error.response.status, data: error.response.data }
          : error.message
      );
    }
  }
}

client.on("qr", (qr) => {
  console.log("🔒 Escanea el siguiente código QR para iniciar sesión:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ ¡Cliente de WhatsApp Web conectado y listo!");
});

client.on("message", async (msg) => {
  console.log("📩 Mensaje recibido:", msg.body);

  if (msg.body.includes("Primarias Bolivia 2025")) {
    const tokenCompleto = extraerToken(msg.body);

    if (tokenCompleto) {
      console.log("🔍 Token detectado:", tokenCompleto);

      const datosDecodificados = decodificarToken(tokenCompleto);

      if (datosDecodificados) {
        tokens.push({
          token: tokenCompleto,
          numero: datosDecodificados.numero,
          dominio: datosDecodificados.dominio,
        });

        console.log("📦 Datos listos para enviar:", {
          token: tokenCompleto,
          numero: datosDecodificados.numero,
          dominio: datosDecodificados.dominio,
        });

        await enviarTokens();
      }
    } else {
      console.warn("⚠️ No se detectó ningún token válido en el mensaje.");
    }
  }
});

client.on("auth_failure", (error) => {
  console.error("❌ Error de autenticación:", error);
});

client.on("disconnected", (reason) => {
  console.log("🔌 Cliente desconectado:", reason);
});

client.initialize();
