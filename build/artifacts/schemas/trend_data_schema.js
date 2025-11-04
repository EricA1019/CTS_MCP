/**
 * Zod Schemas for Performance Trend Data Validation
 * Time-series datasets for LOC, test count, and coverage metrics
 */
import { z } from 'zod';
/**
 * Single time-series data point
 */
export const TimeSeriesPointSchema = z.object({
    timestamp: z.number().int().positive(),
    value: z.number(),
    metadata: z.record(z.unknown()).optional(),
});
/**
 * Complete trend dataset with multiple time-series
 */
export const TrendDatasetSchema = z.object({
    projectPath: z.string().min(1),
    startDate: z.number().int().positive(),
    endDate: z.number().int().positive(),
    weekCount: z.number().int().positive(),
    loc: z.array(TimeSeriesPointSchema),
    tests: z.array(TimeSeriesPointSchema),
    coverage: z.array(TimeSeriesPointSchema),
});
//# sourceMappingURL=trend_data_schema.js.map