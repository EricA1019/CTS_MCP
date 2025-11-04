## Signals in static functions (edge case)
extends Node

signal global_event_triggered

static func trigger_static_event():
	# Note: signals cannot be emitted from static functions
	# This tests parser doesn't crash on malformed patterns
	pass

func trigger_instance_event():
	global_event_triggered.emit()
