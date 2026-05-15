# Este código tomará una secuencia de paradas (ruta) y un vehículo, y calculará la distancia total recorrida, la carga transportada y las emisiones generadas.
# el fitness se basa en la fórmula: CO2 = Distancia * (Peso del Camión Vacío + Carga Actual) * Factor de Emisión
"""
 El fitness es una métrica que combina la distancia total recorrida y el impacto ecológico (CO2) para evaluar la calidad de una ruta. Se penalizan las rutas que transportan cargas pesadas a largas distancias, incentivando entregas más eficientes y sostenibles.

 se llama fitness porque es la función que se utiliza para evaluar qué tan "buena" es una solución (ruta) en términos de distancia y emisiones. 
 
 En un algoritmo genético, por ejemplo, se buscaría maximizar el fitness, lo que en este caso implicaría minimizar tanto la distancia como las emisiones de CO2.
""" 

from models.stop import Stop

class FitnessEvaluator:
    def __init__(self, vehicle_template):
        self.vehicle_template = vehicle_template

    def calculate(self, route_sequence):
        """
        Recibe una lista de objetos Stop y devuelve el costo total.
        Aplica la lógica Distancia-Peso-Impacto para favorecer entregas pesadas tempranas.
        """
        total_distance = 0
        total_co2 = 0
        
        # 1. Calcular la carga total inicial de la ruta
        # Sumamos la demanda de todos los puntos para saber cuánto peso sale del depósito
        current_load = sum(stop.demand for stop in route_sequence)
        
        # Peso base del camión sin carga (importante para que la distancia siempre cuente)
        weight_empty_truck = 1000 
        
        # Validación de capacidad (Restricción del problema G-VRP)
        if current_load > self.vehicle_template.capacity:
            return {"distance": float('inf'), "co2": float('inf')}

        # 2. Recorrer la secuencia de paradas (Simulación del recorrido)
        for i in range(len(route_sequence) - 1):
            origin = route_sequence[i]
            dest = route_sequence[i+1]
            
            # Cálculo de distancia euclidiana entre nodos
            dist = origin.distance_to(dest)
            total_distance += dist
            
            # CÁLCULO DE IMPACTO ECOLÓGICO (BIAS)
            # CO2 = Distancia * (Peso del Camión Vacío + Carga Actual) * Factor de Emisión
            # Esta fórmula es la clave: penaliza mover cargas grandes a distancias largas.
            load_factor = weight_empty_truck + current_load
            total_co2 += dist * load_factor * self.vehicle_template.emission_factor
            
            # 3. Actualización de la Carga (Descarga en Nodo)
            # Al llegar al destino, se resta la demanda de ese punto.
            # El camión viajará más ligero hacia el siguiente nodo.
            current_load -= dest.demand

        return {
            "distance": round(total_distance, 2),
            "co2": round(total_co2, 2)
        }