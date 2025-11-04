## Multiple signals on consecutive lines
extends Node

signal tick
signal tock
signal beep
signal boop
signal ping
signal pong

func cycle_signals():
	tick.emit()
	tock.emit()
	beep.emit()
	boop.emit()
	ping.emit()
	pong.emit()
