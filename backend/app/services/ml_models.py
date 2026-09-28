from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any


@dataclass
class MissedDoseSample:
    prior_missed: int
    prior_delayed: int
    days_remaining: int
    reminder_response: float
    label: int


class MissedDoseRiskModel:
    def __init__(self) -> None:
        self.thresholds = {
            "prior_missed": 1.5,
            "prior_delayed": 1.5,
            "days_remaining": 21.0,
            "reminder_response": 0.4,
        }

    def predict(self, sample: dict[str, Any] | MissedDoseSample) -> int:
        if isinstance(sample, MissedDoseSample):
            prior_missed = sample.prior_missed
            prior_delayed = sample.prior_delayed
            days_remaining = sample.days_remaining
            reminder_response = sample.reminder_response
        else:
            prior_missed = float(sample.get("prior_missed", 0))
            prior_delayed = float(sample.get("prior_delayed", 0))
            days_remaining = float(sample.get("days_remaining", 0))
            reminder_response = float(sample.get("reminder_response", 0))

        score = 0.0
        score += 1.5 * prior_missed
        score += 1.2 * prior_delayed
        score += max(0.0, (21.0 - days_remaining) / 10.0)
        score += max(0.0, (0.5 - reminder_response) * 2.5)
        return 1 if score >= 2.0 else 0


def _safe_divide(num: float, denom: float) -> float:
    return 0.0 if denom == 0 else num / denom


def _accuracy(y_true: list[int], y_pred: list[int]) -> float:
    return _safe_divide(sum(int(a == b) for a, b in zip(y_true, y_pred)), len(y_true))


def _precision_recall_f1(y_true: list[int], y_pred: list[int]) -> tuple[float, float, float]:
    tp = sum(1 for a, b in zip(y_true, y_pred) if a == 1 and b == 1)
    fp = sum(1 for a, b in zip(y_true, y_pred) if a == 0 and b == 1)
    fn = sum(1 for a, b in zip(y_true, y_pred) if a == 1 and b == 0)

    precision = _safe_divide(tp, tp + fp)
    recall = _safe_divide(tp, tp + fn)
    f1 = _safe_divide(2 * precision * recall, precision + recall)
    return precision, recall, f1


def evaluate_missed_dose_risk_classifier() -> dict[str, float]:
    samples = [
        {"prior_missed": 0, "prior_delayed": 0, "days_remaining": 45, "reminder_response": 1.0, "label": 0},
        {"prior_missed": 0, "prior_delayed": 1, "days_remaining": 18, "reminder_response": 0.4, "label": 0},
        {"prior_missed": 2, "prior_delayed": 1, "days_remaining": 10, "reminder_response": 0.1, "label": 1},
        {"prior_missed": 1, "prior_delayed": 2, "days_remaining": 7, "reminder_response": 0.2, "label": 1},
        {"prior_missed": 1, "prior_delayed": 0, "days_remaining": 30, "reminder_response": 0.7, "label": 0},
        {"prior_missed": 2, "prior_delayed": 3, "days_remaining": 3, "reminder_response": 0.0, "label": 1},
        {"prior_missed": 0, "prior_delayed": 1, "days_remaining": 25, "reminder_response": 0.6, "label": 0},
        {"prior_missed": 1, "prior_delayed": 1, "days_remaining": 12, "reminder_response": 0.3, "label": 1},
    ]

    model = MissedDoseRiskModel()
    y_true = [s["label"] for s in samples]
    y_pred = [model.predict(s) for s in samples]
    accuracy = _accuracy(y_true, y_pred)
    precision, recall, f1 = _precision_recall_f1(y_true, y_pred)

    return {
        "accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
    }


class ForecastBaselineModel:
    def fit(self, values: list[float]) -> None:
        self.values = values

    def predict(self, n_steps: int) -> list[float]:
        if not hasattr(self, "values"):
            raise ValueError("Model not fitted")
        last = self.values[-1]
        return [last for _ in range(n_steps)]


class SimpleDemandForecastModel:
    def fit(self, values: list[float]) -> None:
        self.values = values

    def predict(self, n_steps: int) -> list[float]:
        if not hasattr(self, "values"):
            raise ValueError("Model not fitted")
        if len(self.values) < 2:
            return [float(self.values[-1])] * n_steps

        slope = (self.values[-1] - self.values[-2]) / max(1, len(self.values) - 1)
        preds = []
        for idx in range(n_steps):
            forecast = self.values[-1] + slope * (idx + 1)
            preds.append(max(0.0, forecast))
        return preds


def _mae_rmse(actual: list[float], predicted: list[float]) -> tuple[float, float]:
    errors = [a - p for a, p in zip(actual, predicted)]
    mae = sum(abs(e) for e in errors) / len(errors)
    rmse = math.sqrt(sum(e * e for e in errors) / len(errors))
    return mae, rmse


def _r2_score(actual: list[float], predicted: list[float]) -> float:
    if len(actual) != len(predicted):
        raise ValueError("actual and predicted lengths must match")
    mean_actual = sum(actual) / len(actual)
    ss_res = sum((a - p) ** 2 for a, p in zip(actual, predicted))
    ss_tot = sum((a - mean_actual) ** 2 for a in actual)
    return 0.0 if ss_tot == 0 else 1.0 - (ss_res / ss_tot)


def evaluate_vaccine_demand_forecast() -> dict[str, float]:
    actual = [120, 130, 118, 142, 155, 150, 168, 172, 180, 176]
    forecast_model = SimpleDemandForecastModel()
    baseline_model = ForecastBaselineModel()

    forecast_model.fit(actual)
    baseline_model.fit(actual)

    next_values = [160, 168, 170, 175, 181]
    forecast_pred = forecast_model.predict(len(next_values))
    baseline_pred = baseline_model.predict(len(next_values))

    forecast_mae, forecast_rmse = _mae_rmse(next_values, forecast_pred)
    baseline_mae, baseline_rmse = _mae_rmse(next_values, baseline_pred)
    forecast_r2 = _r2_score(next_values, forecast_pred)

    return {
        "mae": round(float(forecast_mae), 4),
        "rmse": round(float(forecast_rmse), 4),
        "r2": round(float(forecast_r2), 4),
        "naive_mae": round(float(baseline_mae), 4),
        "naive_rmse": round(float(baseline_rmse), 4),
    }
