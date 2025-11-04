## Async signal patterns (Godot 4.x)
extends Node

# Async signals with await keyword
signal async_operation_started
signal async_operation_completed(result: Dictionary)

func _ready():
	async_operation_started.emit()
	var data = await perform_async_task()
	async_operation_completed.emit(data)

func perform_async_task() -> Dictionary:
	await get_tree().create_timer(1.0).timeout
	return {"status": "complete"}
