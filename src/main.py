# Orquestador Principal para la Optimización IntelRR
from models.stop import Stop
from models.vehicle import Vehicle
from core.fitness import FitnessEvaluator
from core.genetic import GeneticAlgorithm
from core.tabu_search import TabuSearch

def run_intelrr_optimization(stops, vehicle_config):
    # 1. Preparar el Evaluador (El Juez)
    vehicle = Vehicle(id=1, capacity=vehicle_config['capacity'])
    evaluator = FitnessEvaluator(vehicle)

    print("--- Iniciando Optimización IntelRR ---")

    # 2. FASE 1: Algoritmo Genético (Exploración Global)
    # Buscamos una buena base en 100 generaciones
    ga = GeneticAlgorithm(stops, evaluator, pop_size=30, mutation_rate=0.2)
    ga.initialize_population()
    
    best_ga_route = None
    for gen in range(100):
        best_ga_route = ga.evolve()
    
    res_ga = evaluator.calculate(best_ga_route)
    print(f"Resultado AG: {res_ga['co2']} kg CO2")

    # 3. FASE 2: Búsqueda Tabú (Refinamiento Local)
    # Tomamos el ganador del AG y lo pulimos
    ts = TabuSearch(evaluator, tabu_size=15, max_iterations=100)
    final_route = ts.optimize(best_ga_route)
    
    res_final = evaluator.calculate(final_route)
    print(f"Resultado Final (Híbrido): {res_final['co2']} kg CO2")
    
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
