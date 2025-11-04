# Parser Regression Diagnostic Report

**Generated**: 2025-10-31T18:35:01.593Z

**Total Fixtures**: 20
**Validation Time**: 4.00ms

## Aggregate Metrics

- **Precision**: 90.91%
- **Recall**: 98.04%
- **F1 Score**: 94.34%
- **Status**: ❌ FAILED

## Per-Fixture Results

### ✅ async_signals

- **True Positives**: 2
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ❌ nested_classes

- **True Positives**: 3
- **False Positives**: 1
- **False Negatives**: 1
- **Precision**: 75.00%
- **Recall**: 75.00%
- **F1 Score**: 75.00%

**Mismatches**:

- **false_positive**: Signal "deeply_nested_event" at line 13 not in ground truth
- **false_negative**: Signal "deeply_nested_event" at line 12 missing from extraction

### ✅ tool_scripts

- **True Positives**: 2
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ❌ multiline_params

- **True Positives**: 0
- **False Positives**: 2
- **False Negatives**: 0
- **Precision**: 0.00%
- **Recall**: 100.00%
- **F1 Score**: 0.00%

**Mismatches**:

- **false_positive**: Signal "data_update" at line 4 not in ground truth
- **false_positive**: Signal "complex_event" at line 10 not in ground truth

### ✅ comments_inline

- **True Positives**: 4
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ typed_arrays

- **True Positives**: 3
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ export_annotations

- **True Positives**: 2
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ enum_params

- **True Positives**: 2
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ callable_params

- **True Positives**: 2
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ variant_params

- **True Positives**: 3
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ dict_params

- **True Positives**: 3
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ node_typed_params

- **True Positives**: 3
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ resource_params

- **True Positives**: 3
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ static_edge_case

- **True Positives**: 1
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ string_literals

- **True Positives**: 3
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ consecutive_signals

- **True Positives**: 6
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ default_params_edge

- **True Positives**: 1
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ whitespace_edge

- **True Positives**: 4
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ✅ conditional_signals

- **True Positives**: 3
- **False Positives**: 0
- **False Negatives**: 0
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1 Score**: 100.00%

### ❌ unicode_names

- **True Positives**: 0
- **False Positives**: 2
- **False Negatives**: 0
- **Precision**: 0.00%
- **Recall**: 100.00%
- **F1 Score**: 0.00%

**Mismatches**:

- **false_positive**: Signal "caf" at line 4 not in ground truth
- **false_positive**: Signal "signal_with_" at line 6 not in ground truth
