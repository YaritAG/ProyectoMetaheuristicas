# Este código tomará una secuencia de paradas (ruta) y un vehículo, y calculará la distancia total recorrida, la carga transportada y las emisiones generadas.

from models.stop import Stop

class FitnessEvaluator:
    def __init__(self, vehicle_template):
        self.vehicle_template = vehicle_template

    def calculate(self, route_sequence):
        """
        Recibe una lista de objetos Stop y devuelve el costo total.
        Menor costo = Mejor ruta (Fitness más alto).
        """
        total_distance = 0
        total_co2 = 0
        
        # 1. Calcular la carga total inicial (suma de todas las demandas)
        current_load = sum(stop.demand for stop in route_sequence)
        
        if current_load > self.vehicle_template.capacity:
            return float('inf')  # Penalización: la ruta es inviable por peso

        # 2. Recorrer la ruta (Transiciones del AFD)
        for i in range(len(route_sequence) - 1):
            origin = route_sequence[i]
            dest = route_sequence[i+1]
            
            # Distancia entre nodos
            dist = origin.distance_to(dest)
            total_distance += dist
            
            # Cálculo de CO2: Distancia * Carga actual * Factor del vehículo
            total_co2 += dist * current_load * self.vehicle_template.emission_factor
            
            # Al llegar al destino, se entrega la carga -> El camión pesa menos
            current_load -= dest.demand

        return {
            "distance": round(total_distance, 2),
            "co2": round(total_co2, 2)
        }