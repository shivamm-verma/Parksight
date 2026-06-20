"""
Congestion heatmap on satellite imagery.
Red = heaviest violation/congestion density, fading outward through
orange/yellow/green to show the diffusing 'impact zone' on surrounding blocks.
"""
import os
import pandas as pd
import folium
from folium.plugins import HeatMap


def build_satellite_heatmap(
    raw_points: list,
    hotspots_df: pd.DataFrame,
    out_path: str = "congestion_heatmap_satellite.html",
    radius: int = 32,
    blur: int = 28,
    top_n_markers: int = 5,
) -> str:
    """
    raw_points  : list of [lat, lon] -- cleaned/deduped violation points
                  (this is df[['latitude','longitude']].values.tolist() after
                  hotspot_detection.clean_coordinates + dedupe_repeat_detections)
    hotspots_df : ranked hotspot table from hotspot_detection.rank_hotspots()
                  (needs columns: rank, center_lat, center_lon, violation_count, matched_junction)
    out_path    : where to save the .html file
    Returns the out_path written.
    """
    if not raw_points:
        raise ValueError("raw_points is empty -- nothing to map")

    center = [sum(p[0] for p in raw_points) / len(raw_points),
              sum(p[1] for p in raw_points) / len(raw_points)]

    m = folium.Map(location=center, zoom_start=13, tiles=None, control_scale=True)

    # real satellite imagery (Esri World Imagery, no API key required)
    folium.TileLayer(
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri World Imagery',
        name='Satellite',
        overlay=False,
        control=True,
    ).add_to(m)

    # heat-diffusion layer: large radius/blur so density visibly spreads into
    # surrounding blocks rather than sitting as tight isolated dots
    HeatMap(
        raw_points,
        name='Congestion heat',
        radius=radius,
        blur=blur,
        min_opacity=0.35,
        max_zoom=14,
        gradient={
            '0.2': '#1d9e75',   # low impact -- teal/green
            '0.4': '#facc15',   # rising -- yellow
            '0.6': '#fb923c',   # moderate -- orange
            '0.8': '#ef4444',   # heavy -- red
            '1.0': '#7f1d1d',   # peak congestion -- dark red core
        },
    ).add_to(m)

    # label the top hotspots for orientation, without cluttering the heat layer
    top = hotspots_df.head(top_n_markers)
    for _, r in top.iterrows():
        folium.CircleMarker(
            location=[r.center_lat, r.center_lon],
            radius=4, color='#ffffff', weight=2, fill=True, fill_color='#ef4444', fill_opacity=0.9,
            popup=folium.Popup(
                f"<b>Rank #{int(r['rank'])}</b><br>{r.violation_count} violations<br>{r.matched_junction}",
                max_width=250,
            ),
        ).add_to(m)

    folium.LayerControl().add_to(m)

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    m.save(out_path)
    return out_path


if __name__ == "__main__":
    # standalone CLI use: expects hotspot_detection.py to have already been run
    # and its outputs available -- see hotspot_detection.py for that pipeline.
    import sys
    import hotspot_detection as hs

    data_path = sys.argv[1] if len(sys.argv) > 1 else "dataset.csv"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "congestion_heatmap_satellite.html"

    df = hs.load_data(data_path)
    df = hs.clean_coordinates(df)
    df = hs.dedupe_repeat_detections(df)
    df = hs.cluster_dbscan(df, eps_meters=50, min_samples=8)
    hotspots = hs.rank_hotspots(df, "cluster_id")

    points = df[["latitude", "longitude"]].values.tolist()
    saved = build_satellite_heatmap(points, hotspots, out_path=out_path)
    print(f"saved {saved}")