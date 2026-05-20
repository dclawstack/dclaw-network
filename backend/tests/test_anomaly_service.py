"""Unit tests for anomaly detection and prediction math logic."""
import pytest
from app.services.prediction_service import _compute_ewma_slope


def test_z_score_above_threshold():
    mean, stddev = 50.0, 5.0
    value = 70.0  # z = 4.0 → anomaly
    z = abs(value - mean) / stddev
    assert z > 3.0


def test_z_score_below_threshold():
    mean, stddev = 50.0, 5.0
    value = 55.0  # z = 1.0 → normal
    z = abs(value - mean) / stddev
    assert z < 3.0


def test_ewma_slope_rising():
    """A steadily increasing series should yield positive slope."""
    values = [10.0, 20.0, 30.0, 40.0, 50.0]
    slope = _compute_ewma_slope(values)
    assert slope > 0


def test_ewma_slope_flat():
    """A flat series should yield slope near zero."""
    values = [25.0, 25.0, 25.0, 25.0, 25.0]
    slope = _compute_ewma_slope(values)
    assert abs(slope) < 0.1


def test_ewma_slope_single_value():
    """Single value — slope should be 0 (not crash)."""
    assert _compute_ewma_slope([42.0]) == 0.0


def test_ewma_slope_falling():
    """Decreasing series should yield negative slope."""
    values = [50.0, 40.0, 30.0, 20.0, 10.0]
    slope = _compute_ewma_slope(values)
    assert slope < 0
