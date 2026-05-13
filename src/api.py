# Puente de comunicación entre el Frontend (Canvas) y el Backend (Optimización)
"""
Esta API sirve como el punto de entrada para que el frontend (HTML/JS) envíe los datos de las paradas y reciba la ruta optimizada.
Utiliza Flask para manejar las solicitudes HTTP y CORS para permitir la comunicación entre el frontend y el backend.

El flujo es el siguiente:
1. El usuario hace clic en el canvas para agregar paradas (nodos).

2. Al hacer clic en "Optimizar", el frontend envía un POST request a esta API con los datos de las paradas y la capacidad del vehículo.

3. La API convierte los datos JSON en objetos de Python, ejecuta el proceso de optimización (Genético + Tabú) y devuelve la ruta optimizada junto con las estadísticas de CO2 y distancia.

4. El frontend recibe la respuesta y actualiza el canvas para mostrar la ruta optimizada.

5. El usuario puede ver el ahorro de CO2 y la distancia total en la interfaz.

6. El usuario puede limpiar el canvas para empezar de nuevo.

Y finalmente, el usuario puede repetir el proceso para seguir optimizando rutas diferentes. 
Esta API es esencial para conectar la lógica de optimización con la interfaz de usuario de manera fluida y eficiente.
Asi es como funciona.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from models.stop import Stop
from main import run_intelrr_optimization

app = Flask(__name__)
CORS(app) # Permite que tu HTML se comunique con el servidor Python

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json
    raw_nodes = data.get('nodes', [])
    capacity = data.get('capacity', 40)

    if not raw_nodes:
        return jsonify({"error": "No hay nodos"}), 400

    # 1. Convertir JSON a objetos Stop de Python
    stops = [
        Stop(n['id'], n['x'], n['y'], n['demand'], n['type']) 
        for n in raw_nodes
    ]

    # 2. Ejecutar el "Cerebro" de IntelRR
    # Esto corre el Genético y luego la Búsqueda Tabú
    final_route, stats = run_intelrr_optimization(stops, {'capacity': capacity})

    # 3. Preparar la respuesta para el Canvas (solo los IDs en orden)
    optimized_order = [stop.id for stop in final_route]

    return jsonify({
        "order": optimized_order,
        "co2": stats['co2'],
        "distance": stats['distance']
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)