## @tool script signal declarations
@tool
extends EditorScript

signal editor_tool_activated
signal tool_parameter_changed(param_name: String, value: Variant)

func _run():
	editor_tool_activated.emit()
	tool_parameter_changed.emit("size", 100)
