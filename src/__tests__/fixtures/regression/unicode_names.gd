## Unicode and non-ASCII characters in signal names
extends Node

signal café_opened
signal 日本語_signal
signal signal_with_émojis
signal Überraschung_event(param: String)

func emit_unicode():
	café_opened.emit()
	signal_with_émojis.emit()
