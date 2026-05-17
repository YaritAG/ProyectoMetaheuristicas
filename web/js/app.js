// Codigo que funciona como orquestador principal para la aplicación web, integrando el canvas y la comunicación con el backend Flask.
// Este código maneja la interacción del usuario, envía los datos al backend para optimización y actualiza la interfaz con los resultados obtenidos.

// Dejamos esta variable global para almacenar el último resultado recibido del backend, lo que nos permitirá actualizar la gráfica de rendimiento y otros elementos de la interfaz de manera dinámica según la métrica seleccionada por el usuario.
let lastResult = null;

// Funcion para calcular el peso total y mostrarlo en la interfaz, comparándolo con la capacidad del vehículo seleccionado.
// Si la carga total supera la capacidad, se muestra una advertencia visual y un toast informativo para alertar al usuario sobre la sobrecarga.
/**
 * Actualiza la barra de progreso y el texto del peso acumulado.
 * Esta función es llamada por canvas_manager.js cada vez que cambias un peso.
 */
function calculateTotalWeight() {
    const totalWeightDisplay = document.getElementById('totalWeightDisplay');
    const progressBar = document.getElementById('weightProgressBar');
    const vehicleSelector = document.getElementById('vehicleSelect');

    // Verificamos que los elementos existan para evitar errores de "null"
    if (!totalWeightDisplay || !progressBar || !vehicleSelector) return;

    // Sumamos el peso de los nodos (la variable 'nodes' debe ser global en canvas_manager.js)
    const total = nodes.reduce((sum, node) => sum + (node.demand || 0), 0);
    const capacity = parseInt(vehicleSelector.value);

    // Actualizamos la interfaz
    totalWeightDisplay.innerText = total;

    // Calculamos el porcentaje de la barra
    const percentage = Math.min((total / capacity) * 100, 100);
    progressBar.style.width = percentage + "%";

    // Cambiamos colores según el estado de carga
    if (total > capacity) {
        totalWeightDisplay.style.color = "#ff5252"; // Rojo si excede
        progressBar.style.backgroundColor = "#ff5252";
    } else {
        totalWeightDisplay.style.color = "#2ecc71"; // Verde si es correcto
        progressBar.style.backgroundColor = "#2ecc71";
    }
}

// Funcion para reiniciar las estadísticas y la gráfica, utilizada cuando el usuario limpia el canvas o inicia una nueva optimización. 
// Esta función restablece los valores mostrados en el panel de métricas y limpia los datos de la gráfica de rendimiento para prepararla para nuevos resultados.
function resetStats() {
    // Reiniciamos los valores de las métricas
    const d = document.getElementById('stat-distance');
    const c = document.getElementById('stat-co2');
    const t = document.getElementById('stat-time');

    if (d) d.innerText = "0.0";
    if (c) c.innerText = "0.0";
    if (t) t.innerText = "0";

    if (metricsChart) {
        metricsChart.data.labels = [];
        metricsChart.data.datasets[0].data = [];
        metricsChart.update();
    }
}

/**
 * Manejador del botón de optimización
 */
document.getElementById('btnOptimize').addEventListener('click', async () => {
    resetStats(); // Limpia lo anterior antes de graficar lo nuevo
    // 1. Validaciones iniciales
    if (nodes.length < 2) {
        showToast("Por favor, añade el depósito y al menos una parada.");
        return; // Este return es legal porque está DENTRO de una función
    }

    const vehicleSelector = document.getElementById('vehicleSelect');
    const capacity = parseInt(vehicleSelector.value);
    const vehicleWeight = parseInt(vehicleSelector.options[vehicleSelector.selectedIndex].dataset.weight);
    const totalLoad = nodes.reduce((sum, node) => sum + (node.demand || 0), 0);

    if (totalLoad > capacity) {
        showToast("⚠️ No se puede optimizar: El peso total excede la capacidad.");
        return;
    }

    try {
        // 2. Llamada al servidor Flask
        const response = await fetch('http://localhost:5000/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nodes: nodes,
                capacity: capacity,
                vehicleEmptyWeight: vehicleWeight
            })
        });

        const textResponse = await response.text();

        // TextResponse para manejar casos donde el backend pueda enviar "Infinity" o valores no numéricos, reemplazándolos por un valor grande para evitar errores de parseo en JSON.
        const sanitized = textResponse.replace(/Infinity/g, "999999");
        const result = JSON.parse(sanitized);

        console.log("Datos recibidos de Flask:", result)

        // Comprobamos que la respuesta es válida y contiene la ruta optimizada
        if (response.ok && result.order) {
            // Actualización de Tarjetas (Km y CO2)
            const distElem = document.getElementById('stat-distance');
            const co2Elem = document.getElementById('stat-co2');
            const timeElem = document.getElementById('stat-time');

            // 1. PRIMERO guardamos los datos (esto quita el error de "not defined")
            lastResult = result;

            // 2. Actualizamos las tarjetas de texto
            if (distElem) distElem.innerText = result.distance.toFixed(2);
            if (co2Elem) co2Elem.innerText = result.co2.toFixed(2);
            if (timeElem) timeElem.innerText = result.execution_time || "0";

            // 3. Dibujamos la ruta y disparamos la gráfica
            drawRoute(result.order);

            // NOTA: Usa SOLO un nombre de función. Si tu función se llama updateChart, usa ese.
            if (metricsChart) {
                // Generamos las etiquetas X (Generación 1, 2, 3...)
                const labels = (result.history_fitness || result.history || []).map((_, i) => `G${i + 1}`);
                metricsChart.data.labels = labels;

                updateChart('fitness'); // Aquí ya no fallará porque lastResult ya tiene datos
            }

            showToast("✅ Ruta optimizada con éxito.");

            // Si el servidor no manda el tiempo, lo calculamos o usamos el recibido
            if (timeElem) {
                timeElem.innerText = result.execution_time || "0";
            }

            // Actualización de la Gráfica de Rendimiento
            if (result.history && Array.isArray(result.history) && metricsChart) {
                // Generamos etiquetas dinámicas según la cantidad de datos en el historial
                metricsChart.data.labels = result.history.map((_, i) => `G${i + 1}`);
                metricsChart.data.datasets[0].data = result.history;

                // Forzamos el redibujado de Chart.js
                metricsChart.update();
            }

            // Si el servidor envía datos específicos para cada métrica, los actualizamos también (esto es opcional pero mejora la experiencia)
            if (result.history_fitness && metricsChart) {
                metricsChart.data.labels = result.history_fitness.map((_, i) => `G${i + 1}`);
                updateChart('fitness'); // Esto llamará a tu nueva función y dibujará todo
            }

            // Guardamos el resultado completo para futuras actualizaciones de la gráfica según la métrica seleccionada
            lastResult = result;
            // Actualizamos la gráfica para mostrar el fitness (distancia total) de la ruta optimizada
            updateChart('fitness'); 
            // Dibujo de la ruta optimizada en el canvas
            drawRoute(result.order);

        // De lo contrario, si el servidor responde pero no con la ruta optimizada, mostramos un mensaje de error específico para esa situación
        } else {
            showToast("Error: El motor no pudo encontrar una ruta viable.");
        }

    } catch (error) {
        console.error("Error en Fetch:", error);
        showToast("Fallo de conexión con el servidor de IntelRR.");
    }
});

/**
 * Actualiza la visualización de la gráfica según la métrica seleccionada.
 * @param {string} viewType - El tipo de estadística ('fitness', 'convergence', 'time', 'baseline')
 */

// Funcion para actualizar la gráfica de rendimiento según la métrica seleccionada por el usuario, utilizando los datos almacenados en lastResult para mostrar la información correspondiente a cada métrica (fitness, convergencia, tiempo de ejecución, línea base).
//  La función también maneja casos donde no hay datos disponibles para evitar errores.
function updateChart(viewType) {
    // 1. Guardia de seguridad: evita errores si no hay datos
    if (!lastResult || !metricsChart) {
        console.warn("⚠️ Intentando actualizar gráfica sin datos de optimización.");
        return;
    }

    let dataToDisplay = [];
    let label = "";
    let color = "";

    // 2. Selección de datos y estilo según la pestaña pulsada
    switch (viewType) {
        case 'fitness':
            label = 'Emisiones CO2 (kg)';
            color = '#2ecc71'; // Esmeralda
            dataToDisplay = lastResult.history_fitness || [];
            break;
        case 'convergence':
            label = 'Índice de Convergencia';
            color = '#e67e22'; // Zanahoria
            dataToDisplay = lastResult.history_convergence || [];
            break;
        case 'time':
            label = 'Tiempo de Ejecución (ms)';
            color = '#3498db'; // Belice
            dataToDisplay = lastResult.history_time || [];
            break;
        case 'baseline':
            label = 'Línea Base (Referencia)';
            color = '#95a5a6'; // Gris
            dataToDisplay = lastResult.history_baseline || [];
            break;
        default:
            console.error("Vista no reconocida:", viewType);
            return;
    }

    // 3. Aplicación de cambios al objeto Chart.js
    metricsChart.data.datasets[0].label = label;
    metricsChart.data.datasets[0].borderColor = color;
    metricsChart.data.datasets[0].backgroundColor = color + "33"; // Color con 20% transparencia
    metricsChart.data.datasets[0].data = dataToDisplay;

    // 4. Renderizado
    metricsChart.update();
}

// Listener para actualizar la barra si el usuario cambia el tipo de vehículo
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
    // Dibujar la línea principal de la flecha
    // Esto se hace en drawRoute para mantener el estilo de línea punteada, aquí solo dibujamos las cabezas de flecha sólidas
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}


let currentVehicleCapacity = 1500;

// Funcion para actualizar las estadísticas del vehículo seleccionado, incluyendo la capacidad máxima y validando si la carga actual excede esa capacidad.
// Al cambiar el vehículo, se actualiza la capacidad máxima mostrada y se verifica si la carga actual excede esa capacidad, mostrando una advertencia visual si es necesario.
function updateVehicleStats() {
    // Obtener la capacidad del vehículo seleccionado
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

// Funcion update demanda a actualizar la demanda de un nodo específico, recalculando el total de carga y actualizando la barra de progreso.
//  Si la carga total supera la capacidad del vehículo, se muestra una advertencia visual y un toast informativo.
/*function updateDemand(id, value) {
    const node = nodes.find(n => n.id === id);
    if (node) {
        node.demand = parseFloat(value) || 0;
        calculateTotalWeight(); // <--- Llamada crucial aquí
    }
}> */

const totalLoad = nodes.reduce((sum, n) => sum + (n.demand || 0), 0);
const capacity = parseInt(document.getElementById('vehicleSelect').value);

// Variable global para la instancia de Chart.js
let metricsChart = null;

// Funcion de chart para inicializar la gráfica de rendimiento, configurando el tipo de gráfico, los datos iniciales y las opciones de estilo para una visualización clara y atractiva.
function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    // Configuración inicial (vacía o con datos de ejemplo)
    metricsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Gen 5'],
            datasets: [{
                label: 'Fitness',
                data: [100, 85, 60, 40, 25], // Datos de prueba
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#7f8c8d' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#7f8c8d' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    metricsChart.data.labels = []; // Limpia las etiquetas de generaciones
    metricsChart.data.datasets[0].data = []; // Limpia los datos de fitness
    metricsChart.update();
}

// Llamar al inicializar la página
document.addEventListener('DOMContentLoaded', initPerformanceChart);

function finalizarOptimizacion(resultados) {
    // 1. Actualizamos etiquetas y datos
    metricsChart.data.labels = resultados.generaciones;
    metricsChart.data.datasets[0].data = resultados.fitness;

    // 2. IMPORTANTE: Llamar a update() para refrescar el canvas
    metricsChart.update();
}

// Función para actualizar las métricas finales después de la optimización, calculando las emisiones de CO2 basadas en la distancia total y actualizando los elementos del HTML con los nuevos valores. También se actualiza la gráfica de rendimiento con el nuevo punto de fitness obtenido.
function updateMetricasFinales(distanciaTotal, tiempoEjecucion) {
    const factorCO2 = 0.21; // Este valor puede cambiar según el vehículo seleccionado
    const emisiones = distanciaTotal * factorCO2;

    // Actualizar los elementos en el HTML
    document.getElementById('stat-distance').innerText = distanciaTotal.toFixed(2);
    document.getElementById('stat-co2').innerText = emisiones.toFixed(2);
    document.getElementById('stat-time').innerText = tiempoEjecucion;

    // También actualizamos la gráfica con el nuevo punto de fitness
    metricsChart.data.datasets[0].data.push(distanciaTotal);
    metricsChart.update();
}