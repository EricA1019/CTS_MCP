## Signals with default parameter values (Godot 4.x)
extends Node

# Note: Signals cannot have default values, but parser should handle gracefully
signal event_with_defaults(value: int, optional: bool)

func emit_event():
	event_with_defaults.emit(42, true)
