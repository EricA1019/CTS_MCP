## Multiline signal parameters
extends Node

signal data_update(
	timestamp: int,
	value: float,
	metadata: Dictionary
)

signal complex_event(
	source: Node,
	event_type: String,
	payload: Variant,
	priority: int
)

func emit_data():
	data_update.emit(
		Time.get_ticks_msec(),
		3.14,
		{"key": "value"}
	)
