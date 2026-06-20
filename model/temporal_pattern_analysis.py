"""
Temporal Pattern Analysis for Parking Violations
-------------------------------------------------
Input : violations CSV (the Bengaluru dataset, 298k rows)
Output: heatmaps, peak-window summaries, shift schedule,
        and a lightweight next-hour prediction model
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import warnings
import io, sys, os

warnings.filterwarnings("ignore")

# ── STEP 0 ── LOAD ────────────────────────────────────────────────────────────
def load_data(filepath: str) -> pd.DataFrame:
    """
    Handles the dataset's quirk: a prose header line before the CSV starts.
    Works on both the 250-row sample and the full 298k file.
    """
    with open(filepath, "r") as f:
        lines = f.readlines()

    csv_start = next(i for i, l in enumerate(lines) if l.startswith("id,"))
    df = pd.read_csv(io.StringIO("".join(lines[csv_start:])))

    # Parse timestamps (UTC-aware)
    df["created_datetime"] = pd.to_datetime(df["created_datetime"], utc=True)
    df["closed_datetime"]  = pd.to_datetime(df["closed_datetime"],  utc=True, errors="coerce")

    # IST = UTC+5:30
    df["created_ist"] = df["created_datetime"].dt.tz_convert("Asia/Kolkata")

    # Time features
    df["hour"]       = df["created_ist"].dt.hour
    df["day_of_week"]= df["created_ist"].dt.dayofweek   # 0=Mon … 6=Sun
    df["day_name"]   = df["created_ist"].dt.day_name()
    df["date"]       = df["created_ist"].dt.date
    df["week"]       = df["created_ist"].dt.isocalendar().week.astype(int)
    df["month"]      = df["created_ist"].dt.month

    # Dwell time (minutes) – NaN where not yet closed
    df["dwell_minutes"] = (
        (df["closed_datetime"] - df["created_datetime"])
        .dt.total_seconds() / 60
    )

    # Severity weight per violation type
    SEVERITY = {
        "PARKING IN A MAIN ROAD": 5,
        "DOUBLE PARKING": 5,
        "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE": 4,
        "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 4,
        "PARKING NEAR ROAD CROSSING": 4,
        "WRONG PARKING": 2,
        "NO PARKING": 2,
        "DEFECTIVE NUMBER PLATE": 1,
    }
    def calc_severity(vtype_str):
        if not isinstance(vtype_str, str):
            return 2
        score = 0
        for k, v in SEVERITY.items():
            if k in vtype_str:
                score += v
        return max(score, 1)

    df["severity_score"] = df["violation_type"].apply(calc_severity)

    # Zone classifier from junction_name / location keywords
    def classify_zone(row):
        loc  = str(row.get("location", "")).lower()
        junc = str(row.get("junction_name", "")).lower()
        combined = loc + " " + junc
        if any(w in combined for w in ["metro", "station", "bus stop", "bustop", "railway"]):
            return "metro"
        if any(w in combined for w in ["school", "college", "hospital", "clinic"]):
            return "school_hospital"
        if any(w in combined for w in ["market", "mall", "commercial", "shop", "bazaar"]):
            return "commercial"
        if any(w in combined for w in ["main road", "outer ring", "flyover", "underpass"]):
            return "arterial"
        return "residential"

    df["zone_type"] = df.apply(classify_zone, axis=1)

    print(f"Loaded {len(df):,} rows  |  date range: "
          f"{df['created_ist'].min().date()} → {df['created_ist'].max().date()}")
    return df


# ── STEP 1 ── HEATMAP  ────────────────────────────────────────────────────────
def plot_heatmap(df: pd.DataFrame, out_dir: str = ".") -> None:
    """
    Hour-of-day × Day-of-week heatmap, coloured by average violation count.
    One plot for all violations + one per zone type.
    """
    DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    HOURS = list(range(24))

    def _heatmap(data, title, fname):
        pivot = (
            data.groupby(["day_of_week","hour"])
                .size()
                .reset_index(name="count")
                .pivot(index="hour", columns="day_of_week", values="count")
                .reindex(index=HOURS, columns=range(7))
                .fillna(0)
        )

        fig, ax = plt.subplots(figsize=(10, 7))
        cmap = mcolors.LinearSegmentedColormap.from_list(
            "viols", ["#EAF3DE","#97C459","#3B6D11","#173404"]
        )
        im = ax.imshow(pivot.values, aspect="auto", cmap=cmap)

        ax.set_xticks(range(7));  ax.set_xticklabels(DAYS)
        ax.set_yticks(range(24)); ax.set_yticklabels(
            [f"{h%12 or 12}{'am' if h<12 else 'pm'}" for h in range(24)],
            fontsize=8
        )
        plt.colorbar(im, ax=ax, label="Avg violations")
        ax.set_title(title, fontsize=13, fontweight="bold", pad=14)
        ax.set_xlabel("Day of week")
        ax.set_ylabel("Hour of day (IST)")
        plt.tight_layout()
        path = os.path.join(out_dir, fname)
        plt.savefig(path, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"  Saved → {path}")

    _heatmap(df, "All violations — hour × day heatmap", "heatmap_all.png")
    for zone in df["zone_type"].unique():
        _heatmap(
            df[df["zone_type"] == zone],
            f"Zone: {zone} — hour × day heatmap",
            f"heatmap_{zone}.png",
        )


# ── STEP 2 ── PEAK WINDOWS ────────────────────────────────────────────────────
def peak_windows(df: pd.DataFrame) -> pd.DataFrame:
    """
    For every (zone × day_of_week) pair, find the top-3 peak hours
    and return a ranked enforcement schedule.
    """
    DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

    agg = (
        df.groupby(["zone_type","day_of_week","hour"])
          .agg(
              count        = ("id", "count"),
              avg_severity = ("severity_score", "mean"),
          )
          .reset_index()
    )
    agg["priority_score"] = agg["count"] * agg["avg_severity"]

    rows = []
    for (zone, dow), grp in agg.groupby(["zone_type","day_of_week"]):
        top = grp.nlargest(3, "priority_score")
        for _, r in top.iterrows():
            h = int(r["hour"])
            rows.append({
                "zone"          : zone,
                "day"           : DAYS[dow],
                "peak_hour"     : f"{h%12 or 12}{'am' if h<12 else 'pm'}",
                "violations"    : int(r["count"]),
                "avg_severity"  : round(r["avg_severity"], 2),
                "priority_score": round(r["priority_score"], 1),
            })

    schedule = (
        pd.DataFrame(rows)
          .sort_values("priority_score", ascending=False)
          .reset_index(drop=True)
    )
    print("\nTop 15 enforcement windows:")
    print(schedule.head(15).to_string(index=False))
    return schedule


# ── STEP 3 ── DAILY TREND ─────────────────────────────────────────────────────
def plot_daily_trend(df: pd.DataFrame, out_dir: str = ".") -> None:
    """
    Rolling 7-day violation count to surface seasonal/event spikes.
    """
    daily = df.groupby("date").size().reset_index(name="count")
    daily["date"] = pd.to_datetime(daily["date"])
    daily = daily.sort_values("date")
    daily["rolling7"] = daily["count"].rolling(7, min_periods=1).mean()

    fig, ax = plt.subplots(figsize=(12, 4))
    ax.bar(daily["date"], daily["count"], color="#C0DD97", alpha=0.6, label="Daily count")
    ax.plot(daily["date"], daily["rolling7"], color="#3B6D11", lw=2, label="7-day rolling avg")
    ax.set_title("Daily violations over time", fontsize=12, fontweight="bold")
    ax.set_xlabel("Date"); ax.set_ylabel("Violation count")
    ax.legend(fontsize=9)
    plt.xticks(rotation=30, ha="right", fontsize=8)
    plt.tight_layout()
    path = os.path.join(out_dir, "daily_trend.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {path}")


# ── STEP 4 ── VEHICLE MIX BY HOUR ─────────────────────────────────────────────
def plot_vehicle_hour(df: pd.DataFrame, out_dir: str = ".") -> None:
    """
    Stacked area chart: which vehicle types dominate at each hour.
    Useful for targeting enforcement type (tow truck vs ticket).
    """
    TOP_TYPES = df["vehicle_type"].value_counts().head(6).index.tolist()
    sub = df[df["vehicle_type"].isin(TOP_TYPES)]
    pivot = (
        sub.groupby(["hour","vehicle_type"])
           .size()
           .unstack(fill_value=0)
           .reindex(columns=TOP_TYPES, fill_value=0)
    )
    pivot_pct = pivot.div(pivot.sum(axis=1), axis=0) * 100

    COLORS = ["#378ADD","#EF9F27","#D85A30","#1D9E75","#7F77DD","#888780"]
    fig, ax = plt.subplots(figsize=(12, 5))
    pivot_pct.plot.area(ax=ax, color=COLORS[:len(TOP_TYPES)], alpha=0.85, linewidth=0)
    ax.set_title("Vehicle type mix by hour of day", fontsize=12, fontweight="bold")
    ax.set_xlabel("Hour of day (IST)"); ax.set_ylabel("% of violations")
    ax.set_xticks(range(24))
    ax.set_xticklabels([f"{h%12 or 12}{'am' if h<12 else 'pm'}" for h in range(24)],
                       rotation=45, ha="right", fontsize=8)
    ax.legend(loc="upper left", fontsize=9, framealpha=0.7)
    plt.tight_layout()
    path = os.path.join(out_dir, "vehicle_hour.png")
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved → {path}")


# ── STEP 5 ── SIMPLE PREDICTION MODEL ────────────────────────────────────────
def build_prediction_model(df: pd.DataFrame):
    """
    Predicts expected violation COUNT for the next hour given:
      - hour, day_of_week, zone_type
    Uses a simple RandomForest on historical aggregates.
    Returns a fitted model + zone_type label encoder.
    """
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import LabelEncoder
    from sklearn.model_selection import cross_val_score

    agg = (
        df.groupby(["zone_type","day_of_week","hour"])
          .agg(count=("id","count"), avg_sev=("severity_score","mean"))
          .reset_index()
    )

    le = LabelEncoder()
    agg["zone_enc"] = le.fit_transform(agg["zone_type"])

    features = ["zone_enc","day_of_week","hour","avg_sev"]
    X = agg[features].values
    y = agg["count"].values

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    scores = cross_val_score(model, X, y, cv=3, scoring="r2")
    print(f"\nPrediction model — 3-fold R²: {scores.mean():.3f} ± {scores.std():.3f}")

    model.fit(X, y)

    # Show feature importances
    fi = dict(zip(features, model.feature_importances_))
    print("  Feature importances:", {k: round(v,3) for k,v in fi.items()})

    return model, le


def predict_next_windows(
    model,
    le,
    zone: str,
    target_day: int,   # 0=Mon … 6=Sun
    n_hours: int = 24,
    avg_sev_default: float = 2.5,
) -> pd.DataFrame:
    """
    Given a zone and day, return predicted violation counts for all 24 hours.
    """
    DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    zone_enc = le.transform([zone])[0]
    records = []
    for h in range(n_hours):
        X = np.array([[zone_enc, target_day, h, avg_sev_default]])
        pred = max(0, model.predict(X)[0])
        records.append({
            "hour": f"{h%12 or 12}{'am' if h<12 else 'pm'}",
            "predicted_violations": round(pred, 1),
            "risk_level": ("HIGH" if pred >= 5 else "MEDIUM" if pred >= 2 else "LOW"),
        })
    result = pd.DataFrame(records)
    print(f"\nPredictions for zone='{zone}' on {DAYS[target_day]}:")
    print(result[result["predicted_violations"] > 0.5].to_string(index=False))
    return result


# ── STEP 6 ── SHIFT SCHEDULE OUTPUT ──────────────────────────────────────────
def generate_shift_schedule(schedule_df: pd.DataFrame, top_n: int = 20) -> str:
    """
    Converts the priority-ranked enforcement windows into a human-readable
    weekly shift schedule suitable for traffic police briefing.
    """
    lines = ["BENGALURU TRAFFIC POLICE — RECOMMENDED ENFORCEMENT SCHEDULE",
             "=" * 62, ""]
    DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    for day in DAYS:
        day_rows = schedule_df[schedule_df["day"] == day].head(5)
        if day_rows.empty:
            continue
        lines.append(f"  {day.upper()}")
        for _, r in day_rows.iterrows():
            bar = "█" * min(int(r["priority_score"] / 5), 20)
            lines.append(
                f"    {r['peak_hour']:>5}  {r['zone']:20s}  "
                f"~{r['violations']:3d} violations  severity {r['avg_severity']:.1f}  {bar}"
            )
        lines.append("")
    return "\n".join(lines)


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    DATA_PATH = sys.argv[1] if len(sys.argv) > 1 else "/mnt/project/Data_sample"
    OUT_DIR   = sys.argv[2] if len(sys.argv) > 2 else "/mnt/user-data/outputs"
    os.makedirs(OUT_DIR, exist_ok=True)

    print("── Loading data ──────────────────────────────────────")
    df = load_data(DATA_PATH)

    print("\n── Generating heatmaps ───────────────────────────────")
    plot_heatmap(df, OUT_DIR)

    print("\n── Computing peak windows ────────────────────────────")
    schedule = peak_windows(df)
    schedule.to_csv(os.path.join(OUT_DIR, "enforcement_windows.csv"), index=False)

    print("\n── Daily trend chart ─────────────────────────────────")
    plot_daily_trend(df, OUT_DIR)

    print("\n── Vehicle mix by hour ───────────────────────────────")
    plot_vehicle_hour(df, OUT_DIR)

    print("\n── Building prediction model ─────────────────────────")
    model, le = build_prediction_model(df)

    # Example: predict violations in 'arterial' zones on Friday
    predict_next_windows(model, le, zone="arterial", target_day=4)

    print("\n── Shift schedule ────────────────────────────────────")
    sched_text = generate_shift_schedule(schedule)
    print(sched_text)
    with open(os.path.join(OUT_DIR, "shift_schedule.txt"), "w") as f:
        f.write(sched_text)

    print(f"\nAll outputs written to: {OUT_DIR}")