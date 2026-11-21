"""Generate deterministic, clearly labeled synthetic data for offline UI preview."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from src.generate_data import SECTORS, BENCHMARKS
from src.rrg_math import build_dataset


def main() -> None:
    rng = np.random.default_rng(48)
    dates = pd.date_range(end='2026-11-20', periods=160, freq='W-FRI')
    t = np.arange(len(dates), dtype=float)
    common = np.exp(0.0014 * t + .018 * np.sin(t / 11.)) * 100
    prices = {
        'SPY': common,
        'RSP': common * np.exp(-0.00042 * t + 0.020 * np.sin(t / 10.2 + 1.4)),
        'QQQ': common * np.exp(0.0011 * t + 0.030 * np.cos(t / 12.4 - .6)),
    }
    for k, ticker in enumerate(SECTORS):
        phase = k * .67
        amplitude = .052 + (k % 4) * .010
        drift = (k - 5) * .0001
        noise = np.cumsum(rng.normal(0, .003, len(t)))
        prices[ticker] = common * np.exp(
            0.003 * np.sin(t / (11. + k % 3) + phase)
            + amplitude * np.cos(t / (9. + k % 4) + phase)
            + drift * t + noise,
        )
    frame = pd.DataFrame(prices, index=dates)
    data = build_dataset(frame, SECTORS, BENCHMARKS, history_weeks=104, demo=True)
    output = Path('site/data/rotation.json')
    output.write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
    print(output, f'({len(data["dates"])} weekly rows; demo only)')


if __name__ == '__main__':
    main()
