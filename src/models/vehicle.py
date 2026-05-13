# Este código sirve para representar el vehiculo que se usará para transportar la carga entre las paradas

class Vehicle:
    def __init__(self, id, capacity, emission_factor=0.12):
        self.id = id
        self.capacity = capacity  # Capacidad máxima en kg
        self.emission_factor = emission_factor  # CO2 por kg/km
        self.current_load = 0
        self.route = [] # Aquí guardaremos la secuencia de objetos Stop

    def reset(self):
        """Limpia el estado del vehículo para una nueva simulación."""
        self.current_load = 0
        self.route = []

    def __repr__(self):
        return f"<Vehículo {self.id} - Capacidad: {self.capacity}kg>"