const axios = require('axios');
const fs = require('fs');

// URL base
const BASE_URL = 'https://sistemadevotacion2025-gqh8hhatgtgufhab.brazilsouth-01.azurewebsites.net/whatsapp';
const PHONE_NUMBER = '76602956';

// Objeto para almacenar todos los resultados
const resultadosPruebas = {
    timestamp: new Date().toISOString(),
    pruebas: []
};

// Lista de prefijos y formatos comunes
const prefijos = [
    '', // Sin prefijo
    '+591', // Con + internacional
    '591', // Sin + internacional
    'cel:', // Prefijo texto
    'num:', // Prefijo texto
    'tel:', // Prefijo texto
    'celular:', // Prefijo texto
    'número:', // Prefijo texto
    'phone:', // Prefijo texto
    'móvil:', // Prefijo texto
];

// Función para crear diferentes formatos de número
function generarFormatosNumero(prefijo, numero) {
    return {
        sinEspacios: `${prefijo}${numero}`,
        conEspacio: `${prefijo} ${numero}`,
        conGuion: `${prefijo}-${numero}`,
        conPuntos: `${prefijo}.${numero}`
    };
}

// Función para realizar pruebas con query params
async function probarQueryParams(prefijo, numero) {
    const formatos = generarFormatosNumero(prefijo, numero);
    
    for (const [formatoNombre, numeroFormateado] of Object.entries(formatos)) {
        try {
            console.log(`Probando query param - ${formatoNombre}: ${numeroFormateado}`);
            const response = await axios.post(`${BASE_URL}?numero=${encodeURIComponent(numeroFormateado)}`);
            
            resultadosPruebas.pruebas.push({
                tipo: 'query_param',
                prefijo,
                formato: formatoNombre,
                numeroFormateado,
                exito: true,
                respuesta: response.data,
                timestamp: new Date().toISOString()
            });
            
            console.log('Éxito:', response.data);
        } catch (error) {
            resultadosPruebas.pruebas.push({
                tipo: 'query_param',
                prefijo,
                formato: formatoNombre,
                numeroFormateado,
                exito: false,
                error: error.response?.data || error.message,
                timestamp: new Date().toISOString()
            });
            
            console.log('Error:', error.response?.data || error.message);
        }
    }
}

// Función para realizar pruebas con body JSON
async function probarBodyJson(prefijo, numero) {
    const formatos = generarFormatosNumero(prefijo, numero);
    
    for (const [formatoNombre, numeroFormateado] of Object.entries(formatos)) {
        try {
            console.log(`Probando body JSON - ${formatoNombre}: ${numeroFormateado}`);
            const response = await axios.post(BASE_URL, {
                numero: numeroFormateado
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            resultadosPruebas.pruebas.push({
                tipo: 'body_json',
                prefijo,
                formato: formatoNombre,
                numeroFormateado,
                exito: true,
                respuesta: response.data,
                timestamp: new Date().toISOString()
            });
            
            console.log('Éxito:', response.data);
        } catch (error) {
            resultadosPruebas.pruebas.push({
                tipo: 'body_json',
                prefijo,
                formato: formatoNombre,
                numeroFormateado,
                exito: false,
                error: error.response?.data || error.message,
                timestamp: new Date().toISOString()
            });
            
            console.log('Error:', error.response?.data || error.message);
        }
    }
}

// Función principal para ejecutar todas las pruebas
async function ejecutarPruebas() {
    for (const prefijo of prefijos) {
        console.log(`\n=== Probando con prefijo: "${prefijo}" ===\n`);
        
        // Probar con query params
        await probarQueryParams(prefijo, PHONE_NUMBER);
        
        // Esperar un poco entre pruebas para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Probar con body JSON
        await probarBodyJson(prefijo, PHONE_NUMBER);
        
        // Esperar entre series de pruebas
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Guardar resultados en un archivo JSON
    const nombreArchivo = `resultados_pruebas_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(nombreArchivo, JSON.stringify(resultadosPruebas, null, 2));
    console.log(`\nResultados guardados en: ${nombreArchivo}`);
}

// Ejecutar las pruebas
console.log('Iniciando pruebas de formato de número telefónico...\n');
ejecutarPruebas().then(() => {
    console.log('\nPruebas completadas');
}).catch(error => {
    console.error('Error en las pruebas:', error);
    // Guardar resultados incluso si hay error
    const nombreArchivo = `resultados_pruebas_error_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(nombreArchivo, JSON.stringify(resultadosPruebas, null, 2));
    console.log(`\nResultados parciales guardados en: ${nombreArchivo}`);
});