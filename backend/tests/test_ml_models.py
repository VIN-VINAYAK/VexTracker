from app.services.ml_models import (
    evaluate_missed_dose_risk_classifier,
    evaluate_vaccine_demand_forecast,
)


def test_missed_dose_risk_classifier_metrics_are_reported():
    report = evaluate_missed_dose_risk_classifier()

    assert set(report.keys()) >= {"accuracy", "precision", "recall", "f1"}
    assert 0.0 <= report["accuracy"] <= 1.0
    assert 0.0 <= report["precision"] <= 1.0
    assert 0.0 <= report["recall"] <= 1.0
    assert 0.0 <= report["f1"] <= 1.0


def test_vaccine_demand_forecast_metrics_are_reported():
    report = evaluate_vaccine_demand_forecast()

    assert set(report.keys()) >= {"mae", "rmse", "r2", "naive_mae", "naive_rmse"}
    assert report["mae"] >= 0.0
    assert report["rmse"] >= 0.0
    assert report["r2"] <= 1.0
