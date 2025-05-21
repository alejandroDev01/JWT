const numero = '76602956';
const prefijo = '591';

// Símbolos y caracteres que podemos usar
const signos = [
    '+', '-', ',', '.', ' ', '(', ')', '[', ']', '{', '}', '|', '/'
];

function generarPatron() {
    let resultado = '+'; 
    
    const incluirPrefijo = Math.random() < 0.5;
    
    if (incluirPrefijo) {
        const signosPrefijo = Math.floor(Math.random() * 3); 
        for (let i = 0; i < signosPrefijo; i++) {
            resultado += signos[Math.floor(Math.random() * signos.length)];
        }
        resultado += prefijo;
    }
    
    const signosAntesNumero = Math.floor(Math.random() * 4); 
    for (let i = 0; i < signosAntesNumero; i++) {
        resultado += signos[Math.floor(Math.random() * signos.length)];
    }
    
    resultado += numero;
    
    return resultado;
}

let contador = 0;
const intervalo = setInterval(() => {
    contador++;
    const nuevoPatron = generarPatron();
    console.log(`Patrón #${contador}: ${nuevoPatron}`);
}, 1000);

process.on('SIGINT', () => {
    clearInterval(intervalo);
    console.log(`\nProceso terminado. Se generaron ${contador} patrones diferentes.`);
    process.exit();
});

console.log('Generando patrones... (Presiona Ctrl+C para detener)');