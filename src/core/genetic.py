# Código de la cracion de la población, crossover y mutación 
import random

# Clase para el algoritmo genético, que se encargará de crear la población inicial, realizar el crossover y la mutación para generar nuevas rutas.
class GeneticAlgorithm:
    def __init__(self, stops, fitness_evaluator, pop_size=20, mutation_rate=0.2):
        self.depot = stops[0]  # Asumimos que el índice 0 es el depósito
        self.delivery_stops = stops[1:]  # El resto son las paradas de entrega
        self.evaluator = fitness_evaluator
        self.pop_size = pop_size
        self.mutation_rate = mutation_rate
        self.population = []

    # Se crea una ruta
    def create_individual(self):
        """Crea una ruta aleatoria: [D, B, A, C, D]"""
        route = random.sample(self.delivery_stops, len(self.delivery_stops))
        return [self.depot] + route + [self.depot]
    
    # Se crea la población inicial
    def initialize_population(self):
        self.population = [self.create_individual() for _ in range(self.pop_size)]

    # Se realiza el crossover entre dos rutas para generar una nueva ruta
    def crossover(self, parent1, parent2):
        """Order Crossover (OX) para mantener la integridad de la ruta."""
        # Extraemos solo los genes (paradas de entrega)
        p1 = parent1[1:-1]
        p2 = parent2[1:-1]
        
        size = len(p1)
        start, end = sorted(random.sample(range(size), 2))
        
        # Heredar segmento del primer padre
        child_mid = p1[start:end]
        # Rellenar con los genes del segundo padre que no estén en el segmento
        child_remaining = [item for item in p2 if item not in child_mid]
        
        # Combinar para formar el hijo completo
        full_child = child_remaining[:start] + child_mid + child_remaining[start:]
        return [self.depot] + full_child + [self.depot]

    # Se realiza la mutación de una ruta para generar una nueva ruta
    def mutate(self, individual):
        """Intercambia dos paradas (Swap Mutation)."""
        if random.random() < self.mutation_rate:
            # Seleccionamos dos índices que no sean los depósitos (extremos)
            if len(individual) > 3: 
                idx1, idx2 = random.sample(range(1, len(individual) - 1), 2)
            individual[idx1], individual[idx2] = individual[idx2], individual[idx1]

        # Retorna la ruta mutada (o sin cambios si no se mutó)
        return individual
    
    # Se ejecuta una generación del algoritmo genético, que incluye la selección de los mejores individuos, el crossover para generar nuevos individuos y la mutación para introducir variabilidad.
    def evolve(self):
        """Ejecuta una generación (Selección, Cruce y Mutación)."""
        # 1. Evaluar y ordenar por CO2 (de menor a mayor)
        self.population.sort(key=lambda x: self.evaluator.calculate(x)['co2'])
        
        # 2. Elitismo: mantenemos a los 2 mejores sin cambios
        new_gen = self.population[:2]
        
        # 3. Completar la población con hijos
        while len(new_gen) < self.pop_size:
            p1, p2 = random.sample(self.population[:10], 2) # Torneo simple entre los mejores
            child = self.crossover(p1, p2)
            child = self.mutate(child)
            new_gen.append(child)
            
        # 4. Reemplazar la población actual con la nueva generación    
        self.population = new_gen
        return self.population[0] # Retorna el mejor de la generación