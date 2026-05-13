# Este archivo representa cada nodo o parada del grafo, con su respectiva información
import math

class Stop:
    def __init__(self, id, x, y, demand=0, name=""):
        self.id = id
        self.name = name if name else f"Parada {id}"
        self.x = x  # Coordenada X del Canvas
        self.y = y  # Coordenada Y del Canvas
        self.demand = demand  # Carga en kg

    def distance_to(self, other_stop):
        """Calcula la distancia euclidiana hacia otra parada."""
        return math.sqrt((other_stop.x - self.x)**2 + (other_stop.y - self.y)**2)

    def __repr__(self):
        return f"<{self.name} (ID: {self.id}) - Demanda: {self.demand}kg>"