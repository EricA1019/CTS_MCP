## Enum-typed signal parameters
extends Node

enum State { IDLE, RUNNING, PAUSED, STOPPED }
enum Priority { LOW, MEDIUM, HIGH, CRITICAL }

signal state_changed(old_state: State, new_state: State)
signal task_scheduled(task_id: String, priority: Priority)

var current_state: State = State.IDLE

func set_state(new_state: State):
	state_changed.emit(current_state, new_state)
	current_state = new_state
