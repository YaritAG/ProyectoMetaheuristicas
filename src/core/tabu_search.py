# Código para la búsqueda tabú, que se encargará de explorar el espacio de soluciones evitando volver a rutas previamente visitadas (tabú) y buscando mejorar la solución actual a través de movimientos locales.
""""
 Es decir: Este componente recibirá la mejor ruta del Genético y la "exprimirá" para obtener el máximo ahorro de emisiones.
"""
import copy

# Clase de la busqueda tabú 
class TabuSearch:
    def __init__(self, fitness_evaluator, tabu_size=10, max_iterations=50):
        self.evaluator = fitness_evaluator
        self.tabu_size = tabu_size
        self.max_iterations = max_iterations
        self.tabu_list = []

    # Genera rutas vecinas intercambiando dos paradas (Swap).
    def get_neighbors(self, route):
        """Genera rutas vecinas intercambiando dos paradas (Swap)."""
        neighbors = []
        # No tocamos el depósito (índice 0 y último)
        for i in range(1, len(route) - 1):
            for j in range(i + 1, len(route) - 1):
                neighbor = copy.copy(route)
                neighbor[i], neighbor[j] = neighbor[j], neighbor[i]
                # Guardamos el vecino y el movimiento que lo generó
                neighbors.append((neighbor, (i, j)))
        return neighbors

    # Optimiza la ruta inicial utilizando la búsqueda tabú.
    def optimize(self, initial_route):
        """Proceso de refinamiento local con memoria."""
        best_route = initial_route
        best_fitness = self.evaluator.calculate(best_route)['co2']
        
        # Empezamos con la ruta inicial como la solución actual
        current_route = initial_route
        # Inicialmente, la lista tabú está vacía
        self.tabu_list = []

        # Iteramos por un número máximo de iteraciones para explorar el espacio de soluciones
        for _ in range(self.max_iterations):
            neighbors = self.get_neighbors(current_route)
            # Ordenar vecinos por su desempeño de CO2
            neighbors.sort(key=lambda x: self.evaluator.calculate(x[0])['co2'])

            # Evaluamos cada vecino en orden de mejor a peor
            for neighbor, move in neighbors:
                # Si el movimiento no es tabú, lo aceptamos
                if move not in self.tabu_list:
                    current_route = neighbor
                    current_fitness = self.evaluator.calculate(neighbor)['co2']
                    
                    # Actualizar la mejor global si encontramos algo superior
                    if current_fitness < best_fitness:
                        best_route = neighbor
                        best_fitness = current_fitness
                    
                    # Gestionar la memoria (Lista Tabú)
                    self.tabu_list.append(move)
                    if len(self.tabu_list) > self.tabu_size:
                        self.tabu_list.pop(0)
                    break

        # Retorna la mejor ruta encontrada después de explorar el espacio de soluciones          
        return best_route