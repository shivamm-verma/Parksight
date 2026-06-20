"""
Pillar 1 — Spatial Hotspot Detection for Illegal Parking Violations
=====================================================================
Pipeline: load -> clean -> dedupe repeat detections -> cluster (DBSCAN or H3)
          -> rank hotspots -> flag junction overlap -> map.


Usage:
    python hotspot_detection.py path/to/full_dataset.csv --method dbscan
    python hotspot_detection.py path/to/full_dataset.csv --method h3
"""

import argparse
import json
from collections import Counter

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN

EARTH_RADIUS_M = 6371000.0


# ---------------------------------------------------------------------------
# 1. LOAD & CLEAN
# ---------------------------------------------------------------------------
def safe_json_list(x):
    """violation_type / offence_code are stored as stringified JSON lists,
    e.g. '["WRONG PARKING","NO PARKING"]'. Convert to real Python lists."""
    try:
        return json.loads(x)
    except Exception:
        return []


def load_data(path):
    df = pd.read_csv(path)
    df['violation_type'] = df['violation_type'].apply(safe_json_list)
    df['offence_code'] = df['offence_code'].apply(safe_json_list)
    df['created_datetime'] = pd.to_datetime(df['created_datetime'], errors='coerce', utc=True)
    return df


def clean_coordinates(df, lat_range=(12.4, 13.4), lon_range=(77.2, 77.9)):
    """Drop missing coordinates and obvious GPS errors (e.g. null-island, out-of-region pings).
    Adjust lat_range/lon_range if your enforcement area extends beyond Bengaluru metro."""
    before = len(df)
    df = df.dropna(subset=['latitude', 'longitude']).copy()
    df = df[df.latitude.between(*lat_range) & df.longitude.between(*lon_range)]
    print(f"[clean_coordinates] kept {len(df)}/{before} rows")
    return df


def dedupe_repeat_detections(df, coord_precision=5, time_window_minutes=30):
    """Some devices log the same physical violation multiple times within seconds/minutes
    (multi-frame ANPR re-triggers on a vehicle that hasn't moved). Counting each as a
    separate violation inflates hotspot density artificially, so collapse rows that share
    the same vehicle_number + same rounded coordinates within a short time window."""
    df = df.sort_values('created_datetime').copy()
    df['lat_r'] = df.latitude.round(coord_precision)
    df['lon_r'] = df.longitude.round(coord_precision)
    df['group_key'] = (df['vehicle_number'].astype(str) + '|' +
                        df['lat_r'].astype(str) + '|' + df['lon_r'].astype(str))

    keep_mask, last_seen = [], {}
    for key, ts in zip(df['group_key'], df['created_datetime']):
        prev = last_seen.get(key)
        if prev is not None and pd.notna(ts) and pd.notna(prev) and (ts - prev) <= pd.Timedelta(minutes=time_window_minutes):
            keep_mask.append(False)
        else:
            keep_mask.append(True)
            last_seen[key] = ts
    df['is_kept'] = keep_mask
    before = len(df)
    out = df[df['is_kept']].drop(columns=['lat_r', 'lon_r', 'group_key', 'is_kept'])
    print(f"[dedupe_repeat_detections] {before} -> {len(out)} rows "
          f"({before - len(out)} repeat detections collapsed)")
    return out


# ---------------------------------------------------------------------------
# 2. CLUSTERING — choose ONE of the two methods below
# ---------------------------------------------------------------------------
def cluster_dbscan(df, eps_meters=50, min_samples=5):
    """Density-based clustering using true haversine distance (accounts for the
    curvature of lat/lon degrees). Groups points within `eps_meters` of each other
    (chained), requiring `min_samples` violations to call it a hotspot.
    cluster_id == -1 means 'noise' / isolated violation, not part of any hotspot.

    NOTE on tuning for the full 298k-row dataset: with far more points than the
    250-row sample, raise min_samples (e.g. 8-15) so hotspots reflect genuinely
    recurring locations rather than a handful of coincidental nearby pins."""
    df = df.copy()
    coords_rad = np.radians(df[['latitude', 'longitude']].values)
    eps_rad = eps_meters / EARTH_RADIUS_M
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine', algorithm='ball_tree')
    df['cluster_id'] = db.fit_predict(coords_rad)
    n_clusters = df['cluster_id'].nunique() - (1 if -1 in df['cluster_id'].values else 0)
    n_noise = (df['cluster_id'] == -1).sum()
    print(f"[cluster_dbscan] {n_clusters} hotspot clusters, {n_noise} isolated violations")
    return df


def assign_h3_cells(df, resolution=10):
    """H3 hexagonal grid binning. Resolution 10 hexagons have an average edge length
    of ~65.9m -- a reasonable proxy for the '~50m' hotspot scale. Unlike DBSCAN, bins
    are fixed-size and deterministic, so re-running on streaming/incremental data
    (new violations arriving daily) is trivial -- no need to re-cluster from scratch.
    Use resolution 11 (~25m edge) for a tighter definition of 'hotspot'."""
    import h3
    df = df.copy()
    df['h3_cell'] = [h3.latlng_to_cell(lat, lon, resolution) for lat, lon in zip(df.latitude, df.longitude)]
    print(f"[assign_h3_cells] res {resolution}: {df['h3_cell'].nunique()} distinct hex cells occupied")
    return df


# ---------------------------------------------------------------------------
# 3. RANK HOTSPOTS & FLAG JUNCTION OVERLAP
# ---------------------------------------------------------------------------
def _flatten_violation_types(series_of_lists):
    c = Counter()
    for lst in series_of_lists:
        for v in lst:
            c[v] += 1
    return dict(c.most_common(3))


def _dominant_junction(junction_series):
    counts = junction_series.value_counts()
    named = counts.drop(labels=['No Junction'], errors='ignore')
    if named.empty:
        return 'UNCATALOGUED (no official junction tag)'
    return named.idxmax()


def rank_hotspots(df, group_col):
    """group_col = 'cluster_id' (DBSCAN, excludes -1 noise) or 'h3_cell' (H3)."""
    work = df[df['cluster_id'] != -1] if group_col == 'cluster_id' else df
    rows = []
    for key, g in work.groupby(group_col):
        rows.append({
            group_col: key,
            'violation_count': len(g),
            'center_lat': g['latitude'].mean(),
            'center_lon': g['longitude'].mean(),
            'top_violation_types': _flatten_violation_types(g['violation_type']),
            'matched_junction': _dominant_junction(g['junction_name']),
            'police_stations': sorted(g['police_station'].dropna().unique().tolist()),
        })
    out = pd.DataFrame(rows).sort_values('violation_count', ascending=False).reset_index(drop=True)
    out.insert(0, 'rank', out.index + 1)
    return out


# ---------------------------------------------------------------------------
# 4. MAP VISUALIZATION
# ---------------------------------------------------------------------------
def build_hotspot_map(hotspots_df, raw_df, out_path='hotspot_map.html'):
    import folium
    center = [raw_df.latitude.mean(), raw_df.longitude.mean()]
    m = folium.Map(location=center, zoom_start=12, tiles='cartodbpositron')

    for _, r in raw_df.iterrows():
        folium.CircleMarker(location=[r.latitude, r.longitude], radius=2,
                             color='#999999', fill=True, fill_opacity=0.4, weight=0).add_to(m)

    max_count = hotspots_df.violation_count.max()
    for _, r in hotspots_df.iterrows():
        intensity = r.violation_count / max_count
        color = '#d73027' if intensity > 0.5 else ('#fc8d59' if intensity > 0.25 else '#fee08b')
        folium.CircleMarker(
            location=[r.center_lat, r.center_lon],
            radius=6 + 18 * intensity, color=color, fill=True, fill_color=color,
            fill_opacity=0.55, weight=1,
            popup=f"Rank #{r['rank']} | {r.violation_count} violations<br>{r.matched_junction}<br>{r.top_violation_types}"
        ).add_to(m)

    m.save(out_path)
    print(f"[build_hotspot_map] saved to {out_path}")


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_csv')
    parser.add_argument('--method', choices=['dbscan', 'h3'], default='dbscan')
    parser.add_argument('--eps_meters', type=float, default=50)
    parser.add_argument('--min_samples', type=int, default=8)
    parser.add_argument('--h3_resolution', type=int, default=10)
    parser.add_argument('--out_csv', default='ranked_hotspots.csv')
    parser.add_argument('--out_map', default='hotspot_map.html')
    args = parser.parse_args()

    df = load_data(args.input_csv)
    df = clean_coordinates(df)
    df = dedupe_repeat_detections(df)

    if args.method == 'dbscan':
        df = cluster_dbscan(df, eps_meters=args.eps_meters, min_samples=args.min_samples)
        group_col = 'cluster_id'
    else:
        df = assign_h3_cells(df, resolution=args.h3_resolution)
        group_col = 'h3_cell'

    hotspots = rank_hotspots(df, group_col)
    hotspots.to_csv(args.out_csv, index=False)
    print(f"[main] ranked hotspots written to {args.out_csv}")

    build_hotspot_map(hotspots, df, out_path=args.out_map)


if __name__ == '__main__':
    main()