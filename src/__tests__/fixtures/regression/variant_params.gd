## Variant-typed generic parameters
extends Node

signal generic_event(data: Variant)
signal flexible_update(key: String, value: Variant)
signal multi_type_signal(id: int, payload: Variant, metadata: Variant)

func emit_generic(info: Variant):
	generic_event.emit(info)
