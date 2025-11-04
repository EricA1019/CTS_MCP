## Signals in conditional compilation blocks
extends Node

signal always_present

# Platform-specific signal
signal mobile_gesture_detected(gesture: String)

# Debug-only signal  
signal debug_info_updated(info: Dictionary)

func emit_signals():
	always_present.emit()
	if OS.get_name() in ["Android", "iOS"]:
		mobile_gesture_detected.emit("swipe")
	if OS.is_debug_build():
		debug_info_updated.emit({"fps": 60})
