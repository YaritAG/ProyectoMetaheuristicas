// Codigo que funciona como orquestador principal para la aplicación web, integrando el canvas y la comunicación con el backend Flask. 
// Este código maneja la interacción del usuario, envía los datos al backend para optimización y actualiza la interfaz con los resultados obtenidos.

document.getElementById('btnOptimize').addEventListener('click', async () => {
    // 1. Validaciones previas
    if (nodes.length < 2) {
        return showToast("Añade al menos el depósito y una parada.");
    }

    const totalLoad = nodes.reduce((sum, node) => sum + (node.demand || 0), 0);
    const vehicleSelector = document.getElementById('vehicleSelect');
    const capacity = parseInt(vehicleSelector.value);
    const vehicleEmptyWeight = parseInt(vehicleSelector.options[vehicleSelector.selectedIndex].dataset.weight);

    // 2. Bloqueo preventivo si hay sobrecarga antes de enviar
    if (totalLoad > capacity) {
        return showToast(`⚠️ No se puede optimizar: La carga (${totalLoad}kg) supera la capacidad del vehículo.`);
    }

    try {
        // 3. Enviar datos al backend
        const response = await fetch('http://localhost:5000/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nodes: nodes,
                capacity: capacity,
                vehicleEmptyWeight: vehicleEmptyWeight // Enviamos la tara del coche
            })
        });

        // 4. Procesar respuesta de forma segura
        const textResponse = await response.text();

        // Limpieza de JSON: Si el backend envía Infinity por error, lo convertimos en un número alto
        const sanitizedText = textResponse.replace(/Infinity/g, "999999");
        const result = JSON.parse(sanitizedText);

        if (response.ok && result.co2 < 999999) {
            // Éxito: Actualizar UI y dibujar
            document.getElementById('co2Stat').innerText = result.co2;
            drawRoute(result.order);
            showToast("✅ Ruta optimizada con éxito.");
        } else {
            // Error controlado desde el servidor
            showToast("Error en el motor: " + (result.error || "La ruta es inviable"));
        }

    } catch (error) {
        console.error("Error en la petición:", error);
        showToast("Fallo de conexión con el servidor de IntelRR.");
    }
});

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
function calculateTotalWeight() {
    // 1. Sumar todas las demandas actuales de los nodos
    const total = nodes.reduce((sum, node) => sum + (node.demand || 0), 0);

    // 2. Obtener la capacidad del vehículo seleccionado
    const selector = document.getElementById('vehicleSelect');
    const capacity = parseInt(selector.value);

    // 3. Actualizar el texto en pantalla
    const display = document.getElementById('totalWeightDisplay');
    const bar = document.getElementById('weightProgressBar');

    display.innerText = total;

    // 4. Calcular porcentaje de la barra
    const percentage = Math.min((total / capacity) * 100, 100);
    bar.style.width = percentage + "%";

    // 5. Cambiar colores si hay sobrecarga
    if (total > capacity) {
        display.classList.add('overloaded-text');
        bar.classList.add('overloaded-bar');
    } else {
        display.classList.remove('overloaded-text');
        bar.classList.remove('overloaded-bar');
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