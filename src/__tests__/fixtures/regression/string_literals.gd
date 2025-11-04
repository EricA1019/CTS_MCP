## String literals and escape sequences in signal context
extends Node

signal message_logged(msg: String)
signal path_updated(filepath: String)
signal regex_pattern_changed(pattern: String)

func log_message():
	message_logged.emit("Message with \"quotes\" and 'apostrophes'")
	path_updated.emit("res://assets/textures/player.png")
	regex_pattern_changed.emit("^[a-zA-Z0-9]+$")
