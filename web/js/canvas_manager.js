// Codigo para manejar el canvas y la interacción con el usuario
// Este código permite al usuario hacer clic en el canvas para agregar nodos (depósito y paradas) y muestra la cantidad de nodos agregados. También incluye un botón para limpiar el canvas.

// función para inicializar el canvas y manejar los eventos de clic
const canvas = document.getElementById('routeCanvas');
const ctx = canvas.getContext('2d');
let nodes = [];

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Crear el nodo (objeto similar a tu modelo Stop.py)
    const node = {
        id: nodes.length,
        x: Math.round(x),
        y: Math.round(y),
        demand: nodes.length === 0 ? 0 : Math.floor(Math.random() * 10) + 1, // Demanda aleatoria
        type: nodes.length === 0 ? 'deposito' : 'parada'
    };

    nodes.push(node);
    drawNode(node);
    document.getElementById('nodeCount').innerText = nodes.length;
});

function drawNode(node) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = node.type === 'deposito' ? '#fb8c00' : '#1976d2';
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "black";
    ctx.fillText(node.type === 'deposito' ? "D" : node.id, node.x + 10, node.y - 10);
}

document.getElementById('btnClear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes = [];
    document.getElementById('nodeCount').innerText = "0";
});