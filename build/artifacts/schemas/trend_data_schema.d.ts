/**
 * Zod Schemas for Performance Trend Data Validation
 * Time-series datasets for LOC, test count, and coverage metrics
 */
import { z } from 'zod';
/**
 * Single time-series data point
 */
export declare const TimeSeriesPointSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    value: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    value: number;
    timestamp: number;
    metadata?: Record<string, unknown> | undefined;
}, {
    value: number;
    timestamp: number;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Complete trend dataset with multiple time-series
 */
export declare const TrendDatasetSchema: z.ZodObject<{
    projectPath: z.ZodString;
    startDate: z.ZodNumber;
    endDate: z.ZodNumber;
    weekCount: z.ZodNumber;
    loc: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodNumber;
        value: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }, {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    tests: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodNumber;
        value: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }, {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    coverage: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodNumber;
        value: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }, {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    projectPath: string;
    loc: {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    startDate: number;
    endDate: number;
    weekCount: number;
    tests: {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    coverage: {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
}, {
    projectPath: string;
    loc: {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    startDate: number;
    endDate: number;
    weekCount: number;
    tests: {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    coverage: {
        value: number;
        timestamp: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
}>;
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;
export type TrendDataset = z.infer<typeof TrendDatasetSchema>;
//# sourceMappingURL=trend_data_schema.d.ts.map