"""
FastAPI backend for the parking-congestion-intelligence pipeline.
Wraps three modules:
  - hotspot_detection.py          (Pillar 1: spatial hotspot clusters)
  - build_satellite_heatmap.py    (satellite + heat-diffusion map)
  - temporal_pattern_analysis.py  (Pillar 3: time-of-day/week patterns + prediction)

Run:
    uvicorn main:app --reload --port 8000

Dataset:
    Expects a CSV at DATASET_PATH (default "dataset.csv", same prose-header
    format as the sample/full dataset). Override with env var DATASET_PATH.
"""

import os
import threading
from typing import Optional, Literal

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import model.hotspot_detection as hs
import model.build_satellite_heatmap as heatmap_mod
import parking_api.old_temporal_pattern_analysis as temporal

# ── CONFIG ────────────────────────────────────────────────────────────────────
DATASET_PATH = os.environ.get("DATASET_PATH", "dataset.csv")
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

app = FastAPI(title="Parking Congestion Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to your frontend's origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# serves generated PNGs/HTML/CSVs at e.g. GET /files/heatmap_all.png
app.mount("/files", StaticFiles(directory=OUTPUT_DIR), name="files")


# ── IN-MEMORY CACHE ───────────────────────────────────────────────────────────
# Avoids re-parsing the 298k-row CSV (and retraining the model) on every request.
# A simple dict + lock is enough for a single-process dev/demo server; swap for
# Redis or a proper job queue if this needs to run multi-worker in production.
_cache: dict = {}
_lock = threading.RLock()  # RLock: several cache getters call each other while
                            # already holding the lock (e.g. get_prediction_model
                            # -> get_temporal_df) -- a plain Lock would deadlock there.


def _file_url(filename: str) -> str:
    return f"/files/{filename}"


# ---- temporal module cache ----
def get_temporal_df() -> pd.DataFrame:
    with _lock:
        if "temporal_df" not in _cache:
            if not os.path.exists(DATASET_PATH):
                raise HTTPException(status_code=404, detail=f"dataset not found at {DATASET_PATH}")
            _cache["temporal_df"] = temporal.load_data(DATASET_PATH)
        return _cache["temporal_df"]


def get_peak_schedule() -> pd.DataFrame:
    with _lock:
        if "schedule" not in _cache:
            _cache["schedule"] = temporal.peak_windows(get_temporal_df())
        return _cache["schedule"]


def get_prediction_model():
    with _lock:
        if "model" not in _cache:
            model, le = temporal.build_prediction_model(get_temporal_df())
            _cache["model"], _cache["le"] = model, le
        return _cache["model"], _cache["le"]


# ---- hotspot module cache (keyed by method + params, since results differ) ----
def get_hotspot_result(method: str, eps_meters: float, min_samples: int, h3_resolution: int):
    key = ("hotspots", method, eps_meters, min_samples, h3_resolution)
    with _lock:
        if key in _cache:
            return _cache[key]

    if not os.path.exists(DATASET_PATH):
        raise HTTPException(status_code=404, detail=f"dataset not found at {DATASET_PATH}")

    df = hs.load_data(DATASET_PATH)
    df = hs.clean_coordinates(df)
    df = hs.dedupe_repeat_detections(df)

    if method == "dbscan":
        df = hs.cluster_dbscan(df, eps_meters=eps_meters, min_samples=min_samples)
        group_col = "cluster_id"
    else:
        df = hs.assign_h3_cells(df, resolution=h3_resolution)
        group_col = "h3_cell"

    hotspots = hs.rank_hotspots(df, group_col)
    with _lock:
        _cache[key] = (df, hotspots)
    return df, hotspots


# ── HEALTH / CACHE CONTROL ────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "dataset_path": DATASET_PATH, "dataset_exists": os.path.exists(DATASET_PATH)}


@app.post("/cache/clear")
def clear_cache():
    """Call after dataset.csv is updated/replaced so the next request re-reads it."""
    with _lock:
        _cache.clear()
    return {"cleared": True}


# ── PILLAR 1: SPATIAL HOTSPOTS (hotspot_detection.py) ────────────────────────
@app.get("/hotspots")
def list_hotspots(
    method: Literal["dbscan", "h3"] = Query("dbscan"),
    eps_meters: float = Query(50, gt=0),
    min_samples: int = Query(8, ge=1),
    h3_resolution: int = Query(10, ge=0, le=15),
):
    """Ranked hotspot table: count, centroid, top violation types, junction overlap."""
    _, hotspots = get_hotspot_result(method, eps_meters, min_samples, h3_resolution)
    group_col = "cluster_id" if method == "dbscan" else "h3_cell"
    records = hotspots.drop(columns=[c for c in [group_col] if c in hotspots.columns]).to_dict(orient="records")
    return {"method": method, "count": len(records), "hotspots": records}


@app.get("/hotspots/map")
def hotspots_map(
    method: Literal["dbscan", "h3"] = Query("dbscan"),
    eps_meters: float = Query(50, gt=0),
    min_samples: int = Query(8, ge=1),
    h3_resolution: int = Query(10, ge=0, le=15),
):
    """Builds (or reuses) the folium hotspot map and returns its URL."""
    df, hotspots = get_hotspot_result(method, eps_meters, min_samples, h3_resolution)
    fname = f"hotspot_map_{method}.html"
    out_path = os.path.join(OUTPUT_DIR, fname)
    hs.build_hotspot_map(hotspots, df, out_path=out_path)
    return {"map_url": _file_url(fname)}


# ── SATELLITE CONGESTION HEATMAP (build_satellite_heatmap.py) ───────────────
@app.get("/heatmap/satellite")
def satellite_heatmap(
    eps_meters: float = Query(50, gt=0),
    min_samples: int = Query(8, ge=1),
    radius: int = Query(32, ge=5, le=100),
    blur: int = Query(28, ge=5, le=100),
):
    """Builds the satellite + heat-diffusion map from the DBSCAN hotspot pipeline."""
    df, hotspots = get_hotspot_result("dbscan", eps_meters, min_samples, 10)
    points = df[["latitude", "longitude"]].values.tolist()
    fname = "congestion_heatmap_satellite.html"
    out_path = os.path.join(OUTPUT_DIR, fname)
    heatmap_mod.build_satellite_heatmap(points, hotspots, out_path=out_path, radius=radius, blur=blur)
    return {"map_url": _file_url(fname), "points_used": len(points)}


# ── PILLAR 3: TEMPORAL PATTERNS (temporal_pattern_analysis.py) ──────────────
@app.get("/temporal/heatmaps")
def temporal_heatmaps():
    """Generates hour x day-of-week heatmap PNGs (overall + one per zone type)."""
    df = get_temporal_df()
    temporal.plot_heatmap(df, OUTPUT_DIR)
    zones = sorted(df["zone_type"].unique().tolist())
    urls = {"all": _file_url("heatmap_all.png")}
    urls.update({z: _file_url(f"heatmap_{z}.png") for z in zones})
    return {"images": urls}


@app.get("/temporal/peak-windows")
def temporal_peak_windows(top_n: int = Query(20, ge=1, le=200)):
    """Ranked (zone, day, hour) enforcement-priority windows."""
    schedule = get_peak_schedule()
    return {"count": min(top_n, len(schedule)), "windows": schedule.head(top_n).to_dict(orient="records")}


@app.get("/temporal/daily-trend")
def temporal_daily_trend():
    df = get_temporal_df()
    temporal.plot_daily_trend(df, OUTPUT_DIR)
    return {"image_url": _file_url("daily_trend.png")}


@app.get("/temporal/vehicle-mix")
def temporal_vehicle_mix():
    df = get_temporal_df()
    temporal.plot_vehicle_hour(df, OUTPUT_DIR)
    return {"image_url": _file_url("vehicle_hour.png")}


@app.get("/temporal/predict")
def temporal_predict(
    zone: str = Query(..., description="e.g. arterial, residential, commercial, metro, school_hospital"),
    day: int = Query(..., ge=0, le=6, description="0=Mon ... 6=Sun"),
):
    """Predicted violation count per hour for a given zone + day, via the RandomForest model."""
    model, le = get_prediction_model()
    if zone not in le.classes_:
        raise HTTPException(status_code=400, detail=f"unknown zone '{zone}'. valid: {list(le.classes_)}")
    result = temporal.predict_next_windows(model, le, zone=zone, target_day=day)
    return {"zone": zone, "day": day, "predictions": result.to_dict(orient="records")}


@app.get("/temporal/shift-schedule")
def temporal_shift_schedule(as_file: bool = Query(False)):
    """Human-readable weekly enforcement shift schedule."""
    schedule = get_peak_schedule()
    text = temporal.generate_shift_schedule(schedule)
    if as_file:
        fname = "shift_schedule.txt"
        with open(os.path.join(OUTPUT_DIR, fname), "w") as f:
            f.write(text)
        return {"file_url": _file_url(fname)}
    return {"schedule_text": text}


@app.post("/temporal/run-all")
def temporal_run_all():
    """
    Mirrors temporal_pattern_analysis.py's __main__ block: generates every
    output (heatmaps, daily trend, vehicle mix, schedule, model) in one call.
    Useful for a single 'generate full report' button on the frontend.
    """
    df = get_temporal_df()
    temporal.plot_heatmap(df, OUTPUT_DIR)
    schedule = temporal.peak_windows(df)
    schedule.to_csv(os.path.join(OUTPUT_DIR, "enforcement_windows.csv"), index=False)
    temporal.plot_daily_trend(df, OUTPUT_DIR)
    temporal.plot_vehicle_hour(df, OUTPUT_DIR)
    model, le = temporal.build_prediction_model(df)
    with _lock:
        _cache["schedule"], _cache["model"], _cache["le"] = schedule, model, le
    sched_text = temporal.generate_shift_schedule(schedule)
    with open(os.path.join(OUTPUT_DIR, "shift_schedule.txt"), "w") as f:
        f.write(sched_text)

    zones = sorted(df["zone_type"].unique().tolist())
    return {
        "heatmap_images": {"all": _file_url("heatmap_all.png"),
                            **{z: _file_url(f"heatmap_{z}.png") for z in zones}},
        "daily_trend_image": _file_url("daily_trend.png"),
        "vehicle_mix_image": _file_url("vehicle_hour.png"),
        "enforcement_windows_csv": _file_url("enforcement_windows.csv"),
        "shift_schedule_file": _file_url("shift_schedule.txt"),
    }