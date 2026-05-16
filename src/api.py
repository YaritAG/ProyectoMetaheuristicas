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

# Librerías necesarias para el servidor y la optimización
from flask import Flask, request, jsonify
from flask_cors import CORS
from models.stop import Stop
from main import run_intelrr_optimization
import json
import time

# Inicialización del servidor Flask
app = Flask(__name__)
# Permite que tu HTML se comunique con el servidor Python sin problemas de CORS
CORS(app, resources={r"/*": {"origins": "*"}}) 

# Ruta para recibir los datos del frontend y ejecutar la optimización
@app.route('/optimize', methods=['POST'])
def optimize():
    try:
        data = request.get_json()
        raw_nodes = data.get('nodes', [])
        capacity = data.get('capacity', 40)

        if not raw_nodes:
            return jsonify({"error": "No hay nodos"}), 400

        # 1. Convertir a objetos Stop
        stops = [
            Stop(n['id'], n['x'], n['y'], n['demand'], n.get('type', 'stop')) 
            for n in raw_nodes
        ]

        # 2. Ejecutar la optimización (Aquí stats ya trae los 4 historiales)
        final_route, stats = run_intelrr_optimization(stops, {'capacity': capacity})

        # 3. Respuesta al frontend corregida
        return jsonify({
            "order": [s.id for s in final_route],
            "distance": stats.get('distance', 0),
            "co2": stats.get('co2', 0),
            "execution_time": stats.get('execution_time', 0),
            "history_fitness": stats.get('history_fitness', []), # CO2
            "history_convergence": stats.get('history_convergence', []), # Eficiencia
            "history_time": stats.get('history_time', []), # Ms
            "history_baseline": stats.get('history_baseline', []) # Referencia
        })

    except Exception as e:
        print(f"Error en el servidor: {e}") 
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)