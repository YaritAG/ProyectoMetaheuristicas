# Orquestador Principal para la Optimización IntelRR
from models.stop import Stop
from models.vehicle import Vehicle
from core.fitness import FitnessEvaluator
from core.genetic import GeneticAlgorithm
from core.tabu_search import TabuSearch
import time

# Funcion principal que conecta todo el proceso de optimización
def run_intelrr_optimization(stops, vehicle_config):
    # 1. Iniciamos el cronómetro real para el panel de "Tiempo Estimado"
    start_time = time.time()
    
    vehicle = Vehicle(id=1, capacity=vehicle_config['capacity'])
    evaluator = FitnessEvaluator(vehicle)
    
    history = [] 
    mejor_co2_hasta_ahora = float('inf')

    print("--- Iniciando Optimización IntelRR ---")

    # FASE 1: Algoritmo Genético (Exploración Global)
    ga = GeneticAlgorithm(stops, evaluator, pop_size=30, mutation_rate=0.2)
    ga.initialize_population()
    
    best_ga_route = None
    
    # Bucle para ejecutar varias generaciones del AG y mantener un historial de la mejor ruta encontrada hasta el momento.
    # Esto es útil para la gráfica de evolución del CO2 en el frontend.
    for gen in range(100):
        best_ga_route = ga.evolve()
        current_stats = evaluator.calculate(best_ga_route)
        
        if current_stats['co2'] < mejor_co2_hasta_ahora:
            mejor_co2_hasta_ahora = current_stats['co2']
            print(f"Gen {gen}: ¡Mejora detectada! -> {mejor_co2_hasta_ahora}") # Mira tu terminal de VS Code
        
        history.append(mejor_co2_hasta_ahora) 

    # FASE 2: Búsqueda Tabú (Refinamiento Local)
    # Pulimos el resultado del AG para bajar aún más el CO2
    ts = TabuSearch(evaluator, tabu_size=15, max_iterations=100)
    final_route = ts.optimize(best_ga_route)
    
    res_final = evaluator.calculate(final_route)
    
    # 3. Calculamos el tiempo real transcurrido en milisegundos
    duration_ms = int((time.time() - start_time) * 1000)
    
    # 4. Empaquetamos todo para el JSON que espera api.py y app.js
    res_final['history'] = history 
    res_final['execution_time'] = duration_ms 
    
    print(f"Resultado Final: {res_final['co2']} kg CO2 en {duration_ms}ms")
    
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
