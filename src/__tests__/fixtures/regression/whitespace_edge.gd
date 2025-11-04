## Signals with unusual whitespace patterns
extends Node

signal		tabs_before_name
signal  multiple_spaces_before(param: int)
signal trailing_spaces   
signal	mixed_whitespace	(	param1: String,	param2: int	)

func emit_unusual():
	tabs_before_name.emit()
	multiple_spaces_before.emit(10)
