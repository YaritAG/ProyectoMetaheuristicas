// Codigo que funciona como orquestador principal para la aplicación web, integrando el canvas y la comunicación con el backend Flask. 
// Este código maneja la interacción del usuario, envía los datos al backend para optimización y actualiza la interfaz con los resultados obtenidos.

/**
 * Evento principal para enviar la configuración al backend de Python.
 */
document.getElementById('btnOptimize').addEventListener('click', async () => {
    // Validación mínima: Depósito + 1 Parada
    if (nodes.length < 2) {
        return showToast("Añade al menos el depósito y una parada.");
    }

    const vehicleSelector = document.getElementById('vehicleSelect');
    const capacity = parseInt(vehicleSelector.value);
    // Capturamos el peso base (tara) del dataset del option seleccionado
    const vehicleEmptyWeight = parseInt(vehicleSelector.options[vehicleSelector.selectedIndex].dataset.weight);
    const totalLoad = nodes.reduce((sum, node) => sum + (node.demand || 0), 0);

    // Bloqueo preventivo: No enviamos la petición si hay sobrecarga
    if (totalLoad > capacity) {
        return showToast(`⚠️ Capacidad excedida: ${totalLoad}kg de ${capacity}kg permitidos.`);
    }

    try {
        const response = await fetch('http://localhost:5000/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nodes: nodes,
                capacity: capacity,
                vehicleEmptyWeight: vehicleEmptyWeight // Variable crucial para el cálculo de CO2
            })
        });

        // Leemos como texto para limpiar posibles valores "Infinity" que rompen JSON.parse
        const textResponse = await response.text();
        const sanitizedText = textResponse.replace(/Infinity/g, "999999");
        const result = JSON.parse(sanitizedText);

        if (response.ok && result.co2 < 999999) {
            // Actualización de estadísticas en el panel oscuro
            const co2Elem = document.getElementById('co2Stat');
            if (co2Elem) co2Elem.innerText = result.co2;

            drawRoute(result.order); // Función de dibujo en canvas_manager
            showToast("✅ Ruta optimizada con éxito.");
        } else {
            showToast("Error en el motor: " + (result.error || "La ruta es inviable"));
        }

    } catch (error) {
        console.error("Error en la petición:", error);
        showToast("Fallo de conexión con el servidor de IntelRR.");
    }
});

/**
 * Listeners adicionales para asegurar que la UI sea reactiva
 */
// Si el usuario cambia de vehículo, la barra de carga debe reaccionar al nuevo límite
document.getElementById('vehicleSelect').addEventListener('change', calculateTotalWeight);

// Funcion para dibujar la ruta optimizada en el canvas, conectando los nodos según el orden recibido del backend. Se utiliza una línea punteada para representar la ruta y se dibujan flechas para indicar la dirección del recorrido.
function drawRoute(order) {
    // Limpiar líneas anteriores pero mantener nodos
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(drawNode);

    // Variable para dibujar la ruta con estilo "logística"
    ctx.beginPath();
    ctx.setLineDash([5, 5]); // Línea punteada para estilo "logística"
    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = 2;

    // Iteración para dibujar líneas entre los nodos según el orden optimizado
    for (let i = 0; i < order.length - 1; i++) {
        const startNode = nodes.find(n => n.id === order[i]);
        const endNode = nodes.find(n => n.id === order[i + 1]);

        // Dibujar la línea entre los nodos
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(endNode.x, endNode.y);

        // Dibujar una pequeña flecha en el medio (Opcional pero ayuda al AFD)
        drawArrow(startNode.x, startNode.y, endNode.x, endNode.y);
    }
    ctx.stroke();
}

// Funcion para dibujar una flecha entre dos puntos, utilizada para indicar la dirección del recorrido en la ruta optimizada. 
// La función calcula el ángulo de la línea y dibuja dos líneas para formar la cabeza de la flecha.
function drawArrow(fromx, fromy, tox, toy) {
    const headlen = 10;
    const angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}


let currentVehicleCapacity = 1500;

function updateVehicleStats() {
    const selector = document.getElementById('vehicleSelect');
    currentVehicleCapacity = parseInt(selector.value);
    document.getElementById('maxCapacity').innerText = currentVehicleCapacity;
    checkOverload(); // Validar si la nueva capacidad aguanta lo que ya hay
}

// Funcion calculateTotalLoad para calcular la carga total actual en función de las demandas de las paradas, comparándola con la capacidad del vehículo seleccionado.
//  Si la carga total supera la capacidad, se muestra una advertencia visual y un toast informativo para alertar al usuario sobre la sobrecarga.
function calculateTotalLoad() {
    const total = nodes.reduce((sum, node) => sum + node.demand, 0);
    const totalLabel = document.getElementById('totalLoad');
    const progressBar = document.getElementById('loadProgress');

    totalLabel.innerText = total;

    // Calcular porcentaje para la barra visual
    const percentage = Math.min((total / currentVehicleCapacity) * 100, 100);
    progressBar.style.width = percentage + "%";

    if (total > currentVehicleCapacity) {
        totalLabel.style.color = "red";
        progressBar.style.backgroundColor = "#ff5252";
        showToast(`⚠️ Capacidad excedida: ${total}kg de ${currentVehicleCapacity}kg permitidos.`);
    } else {
        totalLabel.style.color = "inherit";
        progressBar.style.backgroundColor = "#2e7d32";
    }
}

// Funcion para calcular el peso total y mostrarlo en la interfaz, comparándolo con la capacidad del vehículo seleccionado. 
// Si la carga total supera la capacidad, se muestra una advertencia visual y un toast informativo para alertar al usuario sobre la sobrecarga.
// Función para calcular el peso total y actualizar la barra (DEBE SER GLOBAL)
function calculateTotalWeight() {
    const totalWeightDisplay = document.getElementById('totalWeightDisplay');
    const progressBar = document.getElementById('weightProgressBar');
    const vehicleSelector = document.getElementById('vehicleSelect');

    // Validación de elementos del DOM
    if (!totalWeightDisplay || !progressBar || !vehicleSelector) return;

    // Sumar demandas de los nodos (asegúrate que 'nodes' sea global en canvas_manager.js)
    const total = nodes.reduce((sum, node) => sum + (node.demand || 0), 0);
    const capacity = parseInt(vehicleSelector.value);

    // Actualizar texto
    totalWeightDisplay.innerText = total;

    // Calcular porcentaje
    const percentage = Math.min((total / capacity) * 100, 100);
    progressBar.style.width = percentage + "%";

    // Colores de alerta
    if (total > capacity) {
        totalWeightDisplay.style.color = "#ff5252";
        progressBar.style.backgroundColor = "#ff5252";
    } else {
        totalWeightDisplay.style.color = "#2ecc71";
        progressBar.style.backgroundColor = "#2ecc71";
    }
}

// Funcion update demanda a actualizar la demanda de un nodo específico, recalculando el total de carga y actualizando la barra de progreso.
//  Si la carga total supera la capacidad del vehículo, se muestra una advertencia visual y un toast informativo.
function updateDemand(id, value) {
    const node = nodes.find(n => n.id === id);
    if (node) {
        node.demand = parseFloat(value) || 0;
        calculateTotalWeight(); // <--- Llamada crucial aquí
    }
}

const totalLoad = nodes.reduce((sum, n) => sum + (n.demand || 0), 0);
const capacity = parseInt(document.getElementById('vehicleSelect').value);

if (totalLoad > capacity) {
    showToast("¡Sobrecarga! Reduce el peso o cambia de vehículo.");
    return;
}

// Asegúrate de que esta variable 'nodes' sea accesible
const response = await fetch('http://localhost:5000/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        nodes: nodes,
        capacity: capacity,
        vehicleEmptyWeight: 1000 // Valor temporal o del selector
    })
});