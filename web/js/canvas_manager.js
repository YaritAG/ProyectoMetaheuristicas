// Codigo para manejar el canvas y la interacción con el usuario
// Este código permite al usuario hacer clic en el canvas para agregar nodos (depósito y paradas) y muestra la cantidad de nodos agregados. También incluye un botón para limpiar el canvas.

// función para inicializar el canvas y manejar los eventos de clic
const canvas = document.getElementById('routeCanvas');
const ctx = canvas.getContext('2d');
let nodes = [];

// Función para mostrar el aviso moderno
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    toast.innerHTML = `
        <span>${message}</span>
        <span class="close-btn">&times;</span>
    `;

    container.appendChild(toast);

    // Función para quitar el toast con efecto
    const removeToast = () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    };

    // Quitar al hacer clic en la X
    toast.querySelector('.close-btn').onclick = removeToast;

    // Quitar automáticamente tras 10 segundos
    setTimeout(removeToast, 10000);
}

// Agregar un nodo al hacer clic en el canvas
// Actualizamos el evento de clic
canvas.addEventListener('click', (e) => {
    // Limitar a 9 nodos (1 depósito + 8 paradas)
    if (nodes.length >= 9) {
        showToast("Límite de 9 nodos alcanzado.");
        return;
    }

    // Obtener la posición del clic relativa al canvas
    const rect = canvas.getBoundingClientRect();
    const node = {
        id: nodes.length,
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
        demand: 0, // Inicia en 0, el usuario lo editará
        type: nodes.length === 0 ? 'deposito' : 'parada'
    };

    // Agregar el nodo a la lista y dibujarlo en el canvas
    nodes.push(node);
    addNodeToPanel(node); 
    drawNode(node);

    // Actualizar el contador de nodos en el panel lateral
    document.getElementById('nodeCount').innerText = nodes.length;
});

// Función para agregar un nodo al panel lateral, mostrando su tipo (depósito o parada) y permitiendo al usuario editar la demanda de cada parada. El depósito no tiene demanda editable.
function addNodeToPanel(node) {
    const list = document.getElementById('nodesList');
    const div = document.createElement('div');
    div.className = `node-item ${node.type}`;

    // Etiqueta para el nodo, mostrando "Depósito" para el primer nodo y "Parada X" para los siguientes. El depósito no tiene un campo de entrada para demanda, mientras que las paradas sí lo tienen.
    const label = node.type === 'deposito' ? 'Depósito' : `Parada ${node.id}`;

    // Si es depósito, la carga suele ser 0 o la capacidad total
    const inputHTML = node.type === 'deposito'
        ? `<span>-</span>`
        : `<input type="number" value="5" min="1" id="demand-${node.id}" onchange="updateDemand(${node.id}, this.value)"> kg`;

    div.innerHTML = `<span><strong>${label}</strong></span> ${inputHTML}`;
    list.appendChild(div);
}

function updateDemand(id, value) {
    const node = nodes.find(n => n.id === id);
    if (node) node.demand = parseFloat(value);
}

// Función para dibujar un nodo en el canvas, diferenciando entre depósito y paradas con colores distintos. También se muestra una etiqueta con el tipo de nodo o su ID.
function drawNode(node) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = node.type === 'deposito' ? '#fb8c00' : '#1976d2';
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "black";
    ctx.fillText(node.type === 'deposito' ? "D" : node.id, node.x + 10, node.y - 10);
}

// Evento para el botón de optimización, que envía los datos al backend y maneja la respuesta para mostrar la ruta optimizada y las estadísticas de CO₂. Se muestra un aviso moderno en caso de error.
document.getElementById('btnClear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes = [];
    document.getElementById('nodeCount').innerText = "0";
});