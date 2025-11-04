## Callable-typed signal parameters (Godot 4.x)
extends Node

signal callback_registered(callback: Callable)
signal event_with_handler(event_name: String, handler: Callable)

func register_listener(cb: Callable):
	callback_registered.emit(cb)
	cb.call()
