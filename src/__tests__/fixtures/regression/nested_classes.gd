## Nested class signal definitions
extends Node

class InnerClass:
	signal inner_signal_activated
	signal inner_data_changed(value: int)
	
	func trigger():
		inner_signal_activated.emit()

class NestedContainer:
	class DeepNested:
		signal deeply_nested_event(msg: String)
		
		func fire():
			deeply_nested_event.emit("test")

signal outer_signal
