const prefijosInternacionales = {
    bolivia: ['591', '+591'],
    sinPrefijo: ['']
};

const prefijosPalabras = {
    español: [
        'cel',
        'cel.',
        'celular',
        'celular:',
        'móvil',
        'móvil:',
        'tel',
        'tel.',
        'teléfono',
        'teléfono:',
        'número',
        'número:',
        'num',
        'num.',
        'núm',
        'núm.',
        'contacto',
        'contacto:',
        'whatsapp',
        'whatsapp:'
    ],
    ingles: [
        'phone',
        'phone:',
        'cell',
        'cell:',
        'mobile',
        'mobile:',
        'number',
        'number:',
        'contact',
        'contact:',
        'tel',
        'tel:',
        'telephone',
        'telephone:',
        'whatsapp',
        'whatsapp:'
    ]
};

const formatosNumero = {
    basico: (numero) => numero,
    conEspacio: (numero) => ` ${numero}`,
    conGuion: (numero) => `-${numero}`,
    conPuntos: (numero) => `.${numero}`,
    conParentesis: (numero) => `(${numero})`,
    conDosPuntos: (numero) => `: ${numero}`
};

function generarCombinaciones(numeroBase) {
    const combinaciones = [];
    
    // Función para generar todas las combinaciones posibles
    function combinarPrefijos(prefijo, numero) {
        Object.values(formatosNumero).forEach(formato => {
            combinaciones.push({
                formato: formato.name || 'formato',
                numeroCompleto: `${prefijo}${formato(numero)}`.trim(),
                prefijo: prefijo,
                numeroBase: numero
            });
        });
    }

    // Generar combinaciones con prefijos internacionales
    Object.entries(prefijosInternacionales).forEach(([pais, prefijos]) => {
        prefijos.forEach(prefijo => {
            combinarPrefijos(prefijo, numeroBase);
        });
    });

    // Generar combinaciones con palabras en español e inglés
    Object.entries(prefijosPalabras).forEach(([idioma, prefijos]) => {
        prefijos.forEach(prefijo => {
            // Combinar con prefijos internacionales
            prefijosInternacionales.bolivia.forEach(prefijoInt => {
                combinarPrefijos(`${prefijo}${prefijoInt}`, numeroBase);
                // Versión con espacio entre prefijo y número internacional
                combinarPrefijos(`${prefijo} ${prefijoInt}`, numeroBase);
            });
            
            // Versión sin prefijo internacional
            combinarPrefijos(prefijo, numeroBase);
        });
    });

    return combinaciones;
}

// Función para realizar las pruebas HTTP
async function probarCombinaciones(numeroBase, url) {
    const axios = require('axios');
    const fs = require('fs');
    
    const resultados = {
        timestamp: new Date().toISOString(),
        numeroBase: numeroBase,
        pruebas: []
    };

    const combinaciones = generarCombinaciones(numeroBase);

    for (const combinacion of combinaciones) {
        // Probar con query params
        try {
            console.log(`Probando query param: ${combinacion.numeroCompleto}`);
            const response = await axios.post(`${url}?numero=${encodeURIComponent(combinacion.numeroCompleto)}`);
            resultados.pruebas.push({
                tipo: 'query_param',
                ...combinacion,
                exito: true,
                respuesta: response.data
            });
        } catch (error) {
            resultados.pruebas.push({
                tipo: 'query_param',
                ...combinacion,
                exito: false,
                error: error.response?.data || error.message
            });
        }

        // Esperar un poco entre peticiones
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Probar con body JSON
        try {
            console.log(`Probando body JSON: ${combinacion.numeroCompleto}`);
            const response = await axios.post(url, {
                numero: combinacion.numeroCompleto
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            resultados.pruebas.push({
                tipo: 'body_json',
                ...combinacion,
                exito: true,
                respuesta: response.data
            });
        } catch (error) {
            resultados.pruebas.push({
                tipo: 'body_json',
                ...combinacion,
                exito: false,
                error: error.response?.data || error.message
            });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Guardar resultados
    const nombreArchivo = `resultados_pruebas_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(nombreArchivo, JSON.stringify(resultados, null, 2));
    console.log(`\nResultados guardados en: ${nombreArchivo}`);

    return resultados;
}

// Ejemplo de uso
const URL_API = 'https://sistemadevotacion2025-gqh8hhatgtgufhab.brazilsouth-01.azurewebsites.net/whatsapp';
const NUMERO_BASE = '76602956';

console.log('Iniciando pruebas de combinaciones de números telefónicos...');
probarCombinaciones(NUMERO_BASE, URL_API)
    .then(() => console.log('Pruebas completadas'))
    .catch(error => console.error('Error en las pruebas:', error));