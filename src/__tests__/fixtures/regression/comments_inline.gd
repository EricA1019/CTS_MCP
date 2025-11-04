## Signals with inline comments
extends Node

signal health_changed(new_health: int)  # Player health update
signal damage_taken(amount: float, source: Node)  # Combat damage event
signal item_collected  # No parameters, inventory update

# This signal handles level completion
signal level_completed(score: int, time: float)

func take_damage(dmg: float, attacker: Node):
	damage_taken.emit(dmg, attacker)  # Emit damage event
