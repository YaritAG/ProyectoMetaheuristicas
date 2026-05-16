# Orquestador Principal para la Optimización IntelRR
from models.stop import Stop
from models.vehicle import Vehicle
from core.fitness import FitnessEvaluator
from core.genetic import GeneticAlgorithm
from core.tabu_search import TabuSearch
import time


# Funcion principal que conecta todo el proceso de optimización
def run_intelrr_optimization(stops, vehicle_config):
    # Tiempo de inicio para medir la duración total del proceso
    start_time = time.time()
    
    # Creamos el vehículo y el evaluador de fitness con la configuración dada
    vehicle = Vehicle(id=1, capacity=vehicle_config['capacity'])
    evaluator = FitnessEvaluator(vehicle)
    
    # Inicializamos las 3 listas de historial
    history_fitness = []
    history_convergence = []
    history_time = []
    
    mejor_co2_hasta_ahora = float('inf')

    # Configuración del Algoritmo Genético
    ga = GeneticAlgorithm(stops, evaluator, pop_size=30, mutation_rate=0.2)
    ga.initialize_population()
    
    # BUCLE DE GENERACIONES
    for gen in range(100):
        best_route_gen = ga.evolve()
        stats = evaluator.calculate(best_route_gen)
        
        # Guardamos el mejor CO2 encontrado hasta este punto (Fitness)
        if stats['co2'] < mejor_co2_hasta_ahora:
            mejor_co2_hasta_ahora = stats['co2']
        
        # Guardamos el mejor CO2 de esta generación en el historial de fitness
        history_fitness.append(mejor_co2_hasta_ahora)
        
        # Guardamos la eficiencia (Convergencia)
        # Si no tienes 'efficiency' en el fitness.py, puedes usar stats['co2'] / stats['distance']
        history_convergence.append(stats.get('efficiency', stats['co2']/100))
        
        # Guardamos el tiempo transcurrido hasta esta generación
        history_time.append(int((time.time() - start_time) * 1000))

    # FASE FINAL: Búsqueda Tabú para pulir
    ts = TabuSearch(evaluator, tabu_size=15, max_iterations=100)
    final_route = ts.optimize(best_route_gen)
    
    # Datos finales
    res_final_stats = evaluator.calculate(final_route)
    duration_ms = int((time.time() - start_time) * 1000)

    # Empaquetado total
    res_final_stats['history_fitness'] = history_fitness
    res_final_stats['history_convergence'] = history_convergence
    res_final_stats['history_time'] = history_time
    res_final_stats['history_baseline'] = [history_fitness[0]] * 100
    res_final_stats['execution_time'] = duration_ms

    # Retornamos la ruta final optimizada y las estadísticas finales, incluyendo el historial para las gráficas.
    return final_route, res_final_stats

# ------------------------------------------------------------------------------
if __name__ == "__main__":
    # Escenario de prueba (Simulando clics en el Canvas)
    puntos = [
        Stop(0, 0, 0, demand=0, name="Depósito"),
        Stop(1, 10, 50, demand=5, name="Carga Ligera"),
        Stop(2, 80, 20, demand=15, name="Carga Pesada"),
        Stop(3, 40, 90, demand=8, name="Carga Media"),
        Stop(4, 100, 100, demand=2, name="Punto Lejano")
    ]
    
    config = {'capacity': 40}
    
    ruta, stats = run_intelrr_optimization(puntos, config)
    
    print("\n--- RUTA FINAL OPTIMIZADA ---")
    print(" -> ".join([s.name for s in ruta]))
    print(f"Ahorro de CO2 detectado: {stats['co2']} unidades.")
