import os
import csv
import argparse
import random
import statistics
from datetime import datetime
from math import ceil



# -----------------------
# Helpers de simulación
# -----------------------

def simulate_requests(num_requests: int, arrival_rate: float = 10.0):
    """
    Simula num_requests peticiones.
    - arrival_rate: media de llegadas (requests/segundo), usado para generar tiempos inter-arribo exponencial.
    Devuelve lista de tuplas (id, timestamp_s, latency_ms)
    """
    events = []
    t = 0.0
    for i in range(1, num_requests + 1):
        # tiempo hasta la siguiente llegada (segundos)
        inter = random.expovariate(arrival_rate) if arrival_rate > 0 else 0.0
        t += inter

        # latencia simulada (ms): combinación de procesamiento + red + jitter
        base = random.uniform(20, 50)                 # base processing ms
        network = random.expovariate(1/30)            # cola/exponencial ~ media 30ms
        jitter = random.uniform(-5, 20)               # jitter
        latency_ms = max(1.0, base + network + jitter)

        events.append((i, t, latency_ms))
    return events

def percentile(sorted_values, p):
    """
    Calcula percentil p (0-100) de una lista ordenada.
    """
    if not sorted_values:
        return None
    k = (len(sorted_values)-1) * (p/100)
    f = int(k)
    c = ceil(k)
    if f == c:
        return sorted_values[int(k)]
    d0 = sorted_values[f] * (c - k)
    d1 = sorted_values[c] * (k - f)
    return d0 + d1

def compute_aggregates(events):
    """
    Calcula métricas agregadas a partir de events (id, timestamp_s, latency_ms).
    Devuelve dict con métricas.
    """
    latencies = [e[2] for e in events]
    if not latencies:
        return {}
    lat_sorted = sorted(latencies)
    total_time = (events[-1][1] + events[-1][2]/1000.0) - events[0][1]  # duración aproximada en s
    total_time = max(total_time, 1e-6)
    throughput_rps = len(events) / total_time

    stats = {
        "count": len(latencies),
        "min_ms": min(latencies),
        "max_ms": max(latencies),
        "mean_ms": statistics.mean(latencies),
        "median_ms": statistics.median(latencies),
        "p90_ms": percentile(lat_sorted, 90),
        "p95_ms": percentile(lat_sorted, 95),
        "p99_ms": percentile(lat_sorted, 99),
        "stdev_ms": statistics.stdev(latencies) if len(latencies) > 1 else 0.0,
        "throughput_rps": throughput_rps,
        "total_duration_s": total_time
    }
    return stats

# -----------------------
# I/O: CSV y docs
# -----------------------

def write_csv(path, events, stats):
    """
    Escribe CSV con filas por evento y añade bloques de estadisticas al final.
    """
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["id", "timestamp_s", "latency_ms"])
        for eid, ts, lat in events:
            writer.writerow([eid, f"{ts:.6f}", f"{lat:.3f}"])
        # fila vacía y seccion de estadisticas
        writer.writerow([])
        writer.writerow(["METRIC", "VALUE"])
        for k, v in stats.items():
            writer.writerow([k, f"{v:.6f}" if isinstance(v, float) else v])
    return path

def write_conclusions(docs_dir, stats, csv_path):
    """
    Genera un archivo Markdown en docs/ con conclusiones básicas.
    """
    os.makedirs(docs_dir, exist_ok=True)
    path = os.path.join(docs_dir, "conclusions.md")
    now = datetime.utcnow().isoformat() + "Z"

    lines = [
        f"# Conclusiones del simulador",
        "",
        f"Fecha (UTC): {now}",
        "",
        "## Resumen de métricas",
        "",
    ]
    if not stats:
        lines.append("No hay datos.")
    else:
        lines += [
            f"- Requests simuladas: {stats['count']}",
            f"- Duración aproximada: {stats['total_duration_s']:.3f} s",
            f"- Throughput estimado: {stats['throughput_rps']:.2f} req/s",
            f"- Latencia mínima: {stats['min_ms']:.3f} ms",
            f"- Latencia media: {stats['mean_ms']:.3f} ms",
            f"- Mediana: {stats['median_ms']:.3f} ms",
            f"- p90: {stats['p90_ms']:.3f} ms",
            f"- p95: {stats['p95_ms']:.3f} ms",
            f"- p99: {stats['p99_ms']:.3f} ms",
            f"- Latencia máxima: {stats['max_ms']:.3f} ms",
            f"- Desviación estándar: {stats['stdev_ms']:.3f} ms",
            "",
        ]

        # Recomendaciones simples basadas en percentiles
        recs = []
        if stats["p95_ms"] > 500:
            recs.append("- Latencias p95 muy altas (>500ms). Revisar cuellos de botella en backend o red.")
        elif stats["p95_ms"] > 200:
            recs.append("- Latencias p95 moderadas (200-500ms). Optimizar endpoints críticos.")
        else:
            recs.append("- Latencias p95 buenas (<200ms). Monitorear en carga real.")

        if stats["throughput_rps"] < 5:
            recs.append("- Throughput bajo; verificar tasa de llegada y escalado.")
        else:
            recs.append("- Throughput razonable según la simulación.")

        lines.append("## Recomendaciones")
        lines.append("")
        lines += recs
        lines.append("")

    lines += [
        "## Artefactos",
        "",
        f"- CSV con detalles: {csv_path}",
        "",
        "Fin del reporte."
    ]

    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    return path

# -----------------------
# CLI
# -----------------------

def main():
    parser = argparse.ArgumentParser(description="Simulador de latencias para realtime-chat")
    parser.add_argument("--requests", "-n", type=int, default=500, help="Número de requests a simular")
    parser.add_argument("--rate", "-r", type=float, default=20.0, help="Tasa media de llegadas (req/s)")
    parser.add_argument("--out", "-o", type=str, default="results.csv", help="Archivo CSV de salida")
    parser.add_argument("--docs", "-d", type=str, default="docs", help="Carpeta para guardar conclusiones")
    args = parser.parse_args()

    events = simulate_requests(args.requests, args.rate)
    stats = compute_aggregates(events)
    csv_path = write_csv(args.out, events, stats)
    conclusions_path = write_conclusions(args.docs, stats, csv_path)

    # Resumen por consola (breve)
    print(f"Simulación completada: {len(events)} requests")
    print(f"CSV: {csv_path}")
    print(f"Conclusiones: {conclusions_path}")

if __name__ == "__main__":
    main()