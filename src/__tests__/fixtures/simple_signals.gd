extends Node

# Simple test fixture for tree-sitter parser validation

signal health_changed(new_value: int, old_value: int)
signal damage_taken(amount: float)
signal player_ready
signal item_collected(item_name: String, quantity: int)

func _ready():
	emit_signal("player_ready")

func take_damage(amount: float):
	emit_signal("damage_taken", amount)
