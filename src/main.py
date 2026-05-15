# Orquestador Principal para la Optimización IntelRR
from models.stop import Stop
from models.vehicle import Vehicle
from core.fitness import FitnessEvaluator
from core.genetic import GeneticAlgorithm
from core.tabu_search import TabuSearch

def run_intelrr_optimization(stops, vehicle_config):
    vehicle = Vehicle(id=1, capacity=vehicle_config['capacity'])
    evaluator = FitnessEvaluator(vehicle)
    
    history = [] # <--- LISTA NUEVA PARA LA GRÁFICA

    # FASE 1: Algoritmo Genético
    ga = GeneticAlgorithm(stops, evaluator, pop_size=30, mutation_rate=0.2)
    ga.initialize_population()
    
    best_ga_route = None
    for gen in range(100):
        best_ga_route = ga.evolve()
        # Guardamos el CO2 de la mejor ruta actual para la gráfica
        current_stats = evaluator.calculate(best_ga_route)
        history.append(current_stats['co2']) # <--- GUARDAMOS CADA PASO
    
    # FASE 2: Búsqueda Tabú
    ts = TabuSearch(evaluator, tabu_size=15, max_iterations=100)
    final_route = ts.optimize(best_ga_route)
    
    res_final = evaluator.calculate(final_route)
    
    # AGREGAMOS EL HISTORIAL AL RESULTADO FINAL
    res_final['history'] = history 
    # Calculamos un tiempo estimado (o real si usas la librería time)
    res_final['execution_time'] = 100 # Valor de ejemplo o real
    
    return final_route, res_final

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
