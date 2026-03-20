/**
 * Statistical Calculations Utility
 * Phase 5: Advanced Statistics
 *
 * Implements statistical formulas for PEEC quality control system
 */

/**
 * Calculate mean (average) of numeric values
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} Mean value
 */
const calculateMean = (values) => {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculate median of numeric values
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} Median value
 */
const calculateMedian = (values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Calculate standard deviation
 * @param {Array<number>} values - Array of numeric values
 * @param {number} mean - Pre-calculated mean (optional)
 * @returns {number} Standard deviation
 */
const calculateStandardDeviation = (values, mean = null) => {
  if (!values || values.length === 0) return 0;
  const avg = mean !== null ? mean : calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Calculate coefficient of variation (CV)
 * CV = (SD / Mean) × 100
 * @param {number} sd - Standard deviation
 * @param {number} mean - Mean value
 * @returns {number} Coefficient of variation as percentage
 */
const calculateCoefficientVariation = (sd, mean) => {
  if (!mean || mean === 0) return 0;
  return (sd / mean) * 100;
};

/**
 * Calculate Z-Score
 * Z = (X - Xref) / SD
 * @param {number} value - Laboratory result value
 * @param {number} referenceValue - Reference value
 * @param {number} sd - Standard deviation
 * @returns {number} Z-Score
 */
const calculateZScore = (value, referenceValue, sd) => {
  if (!sd || sd === 0) return 0;
  return (value - referenceValue) / sd;
};

/**
 * Interpret Z-Score according to quality control rules
 * |Z| ≤ 2: Acceptable
 * 2 < |Z| < 3: Warning
 * |Z| ≥ 3: Unacceptable
 * @param {number} zScore - Z-Score value
 * @returns {string} Interpretation: 'acceptable', 'warning', 'unacceptable'
 */
const interpretZScore = (zScore) => {
  const absZ = Math.abs(zScore);
  if (absZ <= 2) return 'acceptable';
  if (absZ < 3) return 'warning';
  return 'unacceptable';
};

/**
 * Calculate IDS (Índice de Desviación Estándar)
 * Values closer to 0 indicate better performance
 * IDS = |Z-Score|
 * @param {number} zScore - Z-Score value
 * @returns {number} IDS score
 */
const calculateIDS = (zScore) => {
  return Math.abs(zScore);
};

/**
 * Calculate DRP (Desvío Relativo Porcentual)
 * DRP = ((Xi - μ) / μ) × 100
 * @param {number} value - Laboratory result value
 * @param {number} mean - Mean value of all laboratories
 * @returns {number} DRP as percentage
 */
const calculateDRP = (value, mean) => {
  if (!mean || mean === 0) return 0;
  return ((value - mean) / mean) * 100;
};

/**
 * Calculate percentile rank of a value within a dataset
 * @param {number} value - Value to find percentile for
 * @param {Array<number>} values - Array of all values
 * @returns {number} Percentile (0-100)
 */
const calculatePercentile = (value, values) => {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  if (index === -1) return 100;
  return (index / sorted.length) * 100;
};

/**
 * Check if a value is within acceptable limits
 * @param {number} value - Value to check
 * @param {number} lowerLimit - Lower limit
 * @param {number} upperLimit - Upper limit
 * @returns {boolean} True if within limits
 */
const isWithinLimits = (value, lowerLimit, upperLimit) => {
  if (lowerLimit !== null && value < lowerLimit) return false;
  if (upperLimit !== null && value > upperLimit) return false;
  return true;
};

/**
 * Filter out values that are outside specified limits
 * @param {Array<Object>} results - Array of result objects with value property
 * @param {number} lowerLimit - Lower limit
 * @param {number} upperLimit - Upper limit
 * @returns {Object} { validResults, excludedResults }
 */
const filterByLimits = (results, lowerLimit, upperLimit) => {
  const validResults = [];
  const excludedResults = [];

  results.forEach(result => {
    const value = parseFloat(result.result_value);
    if (isNaN(value)) {
      excludedResults.push({
        ...result,
        exclusion_reason: 'Non-numeric value'
      });
    } else if (!isWithinLimits(value, lowerLimit, upperLimit)) {
      excludedResults.push({
        ...result,
        exclusion_reason: 'Value outside acceptable limits'
      });
    } else {
      validResults.push(result);
    }
  });

  return { validResults, excludedResults };
};

/**
 * Calculate complete statistics for a set of laboratory results
 * @param {Array<Object>} results - Array of result objects
 * @param {number} referenceValue - Reference value from control sample
 * @param {number} lowerLimit - Lower acceptable limit
 * @param {number} upperLimit - Upper acceptable limit
 * @returns {Object} Complete statistics object
 */
const calculateCompleteStatistics = (results, referenceValue, lowerLimit, upperLimit) => {
  // Filter by limits
  const { validResults, excludedResults } = filterByLimits(results, lowerLimit, upperLimit);

  // Extract numeric values
  const values = validResults.map(r => parseFloat(r.result_value));

  if (values.length === 0) {
    return {
      n_total: results.length,
      n_valid: 0,
      n_excluded: results.length,
      mean_value: null,
      median_value: null,
      standard_deviation: null,
      coefficient_variation: null,
      min_value: null,
      max_value: null,
      reference_value: referenceValue,
      lower_limit: lowerLimit,
      upper_limit: upperLimit,
      validResults: [],
      excludedResults: results
    };
  }

  // Calculate basic statistics
  const mean = calculateMean(values);
  const median = calculateMedian(values);
  const sd = calculateStandardDeviation(values, mean);
  const cv = calculateCoefficientVariation(sd, mean);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    n_total: results.length,
    n_valid: validResults.length,
    n_excluded: excludedResults.length,
    mean_value: mean,
    median_value: median,
    standard_deviation: sd,
    coefficient_variation: cv,
    min_value: min,
    max_value: max,
    reference_value: referenceValue,
    lower_limit: lowerLimit,
    upper_limit: upperLimit,
    validResults,
    excludedResults
  };
};

/**
 * Calculate individual laboratory statistics
 * @param {number} value - Laboratory result value
 * @param {Object} groupStats - Group statistics object
 * @param {Array<number>} allValues - All valid values from all laboratories
 * @returns {Object} Individual laboratory statistics
 */
const calculateLaboratoryStatistics = (value, groupStats, allValues) => {
  const { mean_value, standard_deviation, reference_value } = groupStats;

  const zScore = calculateZScore(value, reference_value || mean_value, standard_deviation);
  const zInterpretation = interpretZScore(zScore);
  const idsScore = calculateIDS(zScore);
  const drpScore = calculateDRP(value, mean_value);
  const deviationFromMean = value - mean_value;
  const percentile = calculatePercentile(value, allValues);

  return {
    z_score: zScore,
    z_interpretation: zInterpretation,
    ids_score: idsScore,
    drp_score: drpScore,
    deviation_from_mean: deviationFromMean,
    percentile: percentile
  };
};

module.exports = {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculateCoefficientVariation,
  calculateZScore,
  interpretZScore,
  calculateIDS,
  calculateDRP,
  calculatePercentile,
  isWithinLimits,
  filterByLimits,
  calculateCompleteStatistics,
  calculateLaboratoryStatistics
};
