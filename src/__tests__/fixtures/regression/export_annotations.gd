## Signals in @export annotated scripts
@icon("res://icon.png")
extends Resource

signal resource_modified
signal property_changed(property_name: String)

@export var data: Dictionary:
	set(value):
		data = value
		resource_modified.emit()
		property_changed.emit("data")
