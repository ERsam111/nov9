// Demand Forecasting Service
// Implements various forecasting models for demand prediction

class ForecastingEngine {
  constructor(historicalData, settings) {
    this.data = historicalData || [];
    this.settings = settings || {};
  }

  // Moving Average
  movingAverage(periods = 3) {
    const forecast = [];
    const values = this.data.map(d => d.value);

    for (let i = periods - 1; i < values.length; i++) {
      const sum = values.slice(i - periods + 1, i + 1).reduce((a, b) => a + b, 0);
      forecast.push({
        period: this.data[i].period,
        date: this.data[i].date,
        actual: values[i],
        forecast: sum / periods,
        method: 'Moving Average'
      });
    }

    return forecast;
  }

  // Weighted Moving Average
  weightedMovingAverage(weights = [0.5, 0.3, 0.2]) {
    const forecast = [];
    const values = this.data.map(d => d.value);
    const periods = weights.length;

    for (let i = periods - 1; i < values.length; i++) {
      let weightedSum = 0;
      for (let j = 0; j < periods; j++) {
        weightedSum += values[i - j] * weights[j];
      }
      forecast.push({
        period: this.data[i].period,
        date: this.data[i].date,
        actual: values[i],
        forecast: weightedSum,
        method: 'Weighted Moving Average'
      });
    }

    return forecast;
  }

  // Exponential Smoothing
  exponentialSmoothing(alpha = 0.3) {
    const forecast = [];
    const values = this.data.map(d => d.value);
    let smoothed = values[0];

    forecast.push({
      period: this.data[0].period,
      date: this.data[0].date,
      actual: values[0],
      forecast: smoothed,
      method: 'Exponential Smoothing'
    });

    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i - 1] + (1 - alpha) * smoothed;
      forecast.push({
        period: this.data[i].period,
        date: this.data[i].date,
        actual: values[i],
        forecast: smoothed,
        method: 'Exponential Smoothing'
      });
    }

    return forecast;
  }

  // Holt's Linear Trend
  holtsLinearTrend(alpha = 0.3, beta = 0.1) {
    const forecast = [];
    const values = this.data.map(d => d.value);
    
    let level = values[0];
    let trend = values[1] - values[0];

    for (let i = 0; i < values.length; i++) {
      const forecastValue = level + trend;
      
      forecast.push({
        period: this.data[i].period,
        date: this.data[i].date,
        actual: values[i],
        forecast: i === 0 ? values[0] : forecastValue,
        method: 'Holt\'s Linear Trend'
      });

      if (i < values.length - 1) {
        const newLevel = alpha * values[i] + (1 - alpha) * (level + trend);
        const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
        level = newLevel;
        trend = newTrend;
      }
    }

    return forecast;
  }

  // Linear Regression
  linearRegression() {
    const forecast = [];
    const n = this.data.length;
    const values = this.data.map(d => d.value);
    const x = Array.from({ length: n }, (_, i) => i);

    // Calculate means
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (values[i] - meanY);
      denominator += (x[i] - meanX) ** 2;
    }
    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    // Generate forecasts
    for (let i = 0; i < n; i++) {
      forecast.push({
        period: this.data[i].period,
        date: this.data[i].date,
        actual: values[i],
        forecast: slope * i + intercept,
        method: 'Linear Regression'
      });
    }

    return { forecast, slope, intercept };
  }

  // Calculate forecast accuracy metrics
  calculateAccuracy(forecast) {
    let sumError = 0;
    let sumAbsError = 0;
    let sumSquaredError = 0;
    let sumPercentError = 0;
    let count = 0;

    for (const point of forecast) {
      if (point.actual !== undefined && point.forecast !== undefined) {
        const error = point.actual - point.forecast;
        const absError = Math.abs(error);
        const percentError = point.actual !== 0 ? Math.abs(error / point.actual) * 100 : 0;

        sumError += error;
        sumAbsError += absError;
        sumSquaredError += error ** 2;
        sumPercentError += percentError;
        count++;
      }
    }

    return {
      ME: sumError / count,                          // Mean Error
      MAE: sumAbsError / count,                      // Mean Absolute Error
      MSE: sumSquaredError / count,                  // Mean Squared Error
      RMSE: Math.sqrt(sumSquaredError / count),      // Root Mean Squared Error
      MAPE: sumPercentError / count                  // Mean Absolute Percentage Error
    };
  }

  // Generate future forecasts
  generateFutureForecast(model, periods = 12) {
    const lastValue = this.data[this.data.length - 1].value;
    const forecast = [];
    const settings = this.settings;

    if (model === 'linear') {
      const { slope, intercept } = this.linearRegression();
      const startIndex = this.data.length;

      for (let i = 0; i < periods; i++) {
        forecast.push({
          period: startIndex + i,
          forecast: slope * (startIndex + i) + intercept,
          method: 'Linear Regression'
        });
      }
    } else if (model === 'exponential') {
      const alpha = settings.alpha || 0.3;
      let smoothed = lastValue;

      for (let i = 0; i < periods; i++) {
        forecast.push({
          period: this.data.length + i,
          forecast: smoothed,
          method: 'Exponential Smoothing'
        });
      }
    } else if (model === 'naive') {
      for (let i = 0; i < periods; i++) {
        forecast.push({
          period: this.data.length + i,
          forecast: lastValue,
          method: 'Naive'
        });
      }
    }

    return forecast;
  }

  // Compare all models and find the best one
  compareModels() {
    const results = {};

    try {
      const ma = this.movingAverage(3);
      results.movingAverage = {
        forecast: ma,
        accuracy: this.calculateAccuracy(ma)
      };
    } catch (e) {
      console.error('Moving Average error:', e);
    }

    try {
      const wma = this.weightedMovingAverage([0.5, 0.3, 0.2]);
      results.weightedMovingAverage = {
        forecast: wma,
        accuracy: this.calculateAccuracy(wma)
      };
    } catch (e) {
      console.error('Weighted Moving Average error:', e);
    }

    try {
      const es = this.exponentialSmoothing(0.3);
      results.exponentialSmoothing = {
        forecast: es,
        accuracy: this.calculateAccuracy(es)
      };
    } catch (e) {
      console.error('Exponential Smoothing error:', e);
    }

    try {
      const holt = this.holtsLinearTrend(0.3, 0.1);
      results.holtsLinearTrend = {
        forecast: holt,
        accuracy: this.calculateAccuracy(holt)
      };
    } catch (e) {
      console.error('Holt\'s Linear Trend error:', e);
    }

    try {
      const { forecast: lr } = this.linearRegression();
      results.linearRegression = {
        forecast: lr,
        accuracy: this.calculateAccuracy(lr)
      };
    } catch (e) {
      console.error('Linear Regression error:', e);
    }

    // Find best model based on MAPE
    let bestModel = null;
    let bestMAPE = Infinity;

    for (const [model, result] of Object.entries(results)) {
      if (result.accuracy.MAPE < bestMAPE) {
        bestMAPE = result.accuracy.MAPE;
        bestModel = model;
      }
    }

    return { results, bestModel };
  }
}

export async function forecastDemand(requestData) {
  try {
    const { historicalData, settings } = requestData;
    
    console.log(`Starting demand forecast with ${historicalData.length} data points`);
    
    const engine = new ForecastingEngine(historicalData, settings);
    const comparison = engine.compareModels();
    
    // Generate future forecast using best model
    const futureForecast = engine.generateFutureForecast(
      settings.preferredModel || comparison.bestModel,
      settings.forecastPeriods || 12
    );

    return {
      success: true,
      modelComparison: comparison.results,
      bestModel: comparison.bestModel,
      futureForecast,
      summary: {
        historicalPoints: historicalData.length,
        forecastPeriods: futureForecast.length,
        recommendedModel: comparison.bestModel
      }
    };
  } catch (error) {
    console.error('Forecasting error:', error);
    throw error;
  }
}
