// Codigo que funciona como orquestador principal para la aplicación web, integrando el canvas y la comunicación con el backend Flask. 
// Este código maneja la interacción del usuario, envía los datos al backend para optimización y actualiza la interfaz con los resultados obtenidos.

// Importar el módulo de manejo del canvas
document.getElementById('btnOptimize').addEventListener('click', async () => {
    if (nodes.length < 2) return alert("Añade al menos el depósito y una parada.");

    // Enviar los datos al backend para optimización
    const response = await fetch('http://localhost:5000/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nodes: nodes,
            capacity: 40 // Puedes hacerlo dinámico después
        })
    });

    // Obtener la respuesta del backend
    const result = await response.json();

    if (response.ok) { // <--- Solo si el servidor respondió 200 OK
        document.getElementById('co2Stat').innerText = result.co2;
        drawRoute(result.order);
    } else {
        showToast("Error en el motor: " + (result.error || "Fallo interno"));
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