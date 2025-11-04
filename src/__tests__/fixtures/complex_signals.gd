extends Node2D

class_name ComplexEntity

# Complex signal patterns for edge case testing

signal nested_callback(callback: Callable, data: Dictionary)
signal async_operation_complete(result: Variant, error: String)

# Multiline signal declaration
signal state_changed(
	old_state: int,
	new_state: int,
	transition_time: float
)

# Signal with array types
signal inventory_updated(items: Array[Item], capacity: int)

# Signal inside nested class
class InnerComponent:
	signal component_ready(component_id: String)
	signal component_destroyed

# Signal with generic types
signal data_loaded(data: Array, metadata: Dictionary)
