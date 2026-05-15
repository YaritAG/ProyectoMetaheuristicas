// Codigo para manejar el canvas y la interacción con el usuario
// Este código permite al usuario hacer clic en el canvas para agregar nodos (depósito y paradas) y muestra la cantidad de nodos agregados. También incluye un botón para limpiar el canvas.

// web/js/canvas_manager.js

const canvas = document.getElementById('routeCanvas');
const ctx = canvas.getContext('2d');
let nodes = []; // Variable global para que app.js la reconozca

// --- NOTIFICACIONES ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return; // Evita errores si no existe el contenedor

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span>${message}</span>
        <span class="close-btn">&times;</span>
    `;
    container.appendChild(toast);

    const removeToast = () => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    };

    toast.querySelector('.close-btn').onclick = removeToast;
    setTimeout(removeToast, 10000);
}

// --- LÓGICA DEL CANVAS ---
canvas.addEventListener('click', (e) => {
    // 1. Limitar a 9 nodos
    if (nodes.length >= 9) {
        showToast("Límite de 9 nodos alcanzado para estabilidad del sistema.");
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // 2. Crear objeto nodo con IDs consistentes
    const newNode = {
        id: nodes.length,
        x: x,
        y: y,
        demand: 0,
        type: nodes.length === 0 ? 'deposito' : 'parada'
    };

    nodes.push(newNode);
    addNodeToPanel(newNode);
    drawNode(newNode);

    // 3. Actualizar contador (Validar que el ID existe en el HTML)
    const counter = document.getElementById('nodeCount');
    if (counter) counter.innerText = nodes.length;
});

// --- PANEL LATERAL (UI DINÁMICA) ---
function addNodeToPanel(node) {
    const list = document.getElementById('nodesList');
    const div = document.createElement('div');
    div.className = `node-item ${node.type}`;

    const label = node.type === 'deposito' ? 'Depósito' : `Parada ${node.id}`;

    // Nuevo input: Tipo número pero visualmente texto, sin flechas y con oninput
    const inputHTML = node.type === 'deposito'
        ? `<span style="color: #7f8c8d;">---</span>`
        : `<input type="number" 
                  placeholder="0" 
                  id="demand-${node.id}" 
                  class="weight-input"
                  oninput="updateDemand(${node.id}, this.value)"> <span class="unit">kg</span>`;

    div.innerHTML = `<span><strong>${label}</strong></span> ${inputHTML}`;
    list.appendChild(div);
}

// --- ACTUALIZACIÓN DE PESOS Y CÁLCULO TOTAL ---
function updateDemand(id, value) {
    const node = nodes.find(n => n.id === id);
    if (node) {
        node.demand = parseFloat(value) || 0;
        // IMPORTANTE: Llamamos a la función que acabamos de crear en app.js
        if (typeof calculateTotalWeight === "function") {
            calculateTotalWeight();
        }
    }
}
// --- DIBUJO ---
function drawNode(node) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);

    // Colores neón para modo oscuro
    ctx.fillStyle = node.type === 'deposito' ? '#e67e22' : '#3498db';
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fill();
    ctx.closePath();

    // Resetear sombra para el texto
    ctx.shadowBlur = 0;
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Poppins";
    ctx.fillText(node.type === 'deposito' ? "D" : node.id, node.x + 12, node.y - 12);
}

// --- LIMPIAR ---
document.getElementById('btnClear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes = [];

    const list = document.getElementById('nodesList');
    if (list) list.innerHTML = "";

    const counter = document.getElementById('nodeCount');
    if (counter) counter.innerText = "0";

    // Reiniciar pesos acumulados si existe la función
    if (typeof calculateTotalWeight === "function") {
        calculateTotalWeight();
    }
});