extends Node

# Test fixture: typed signal parameters
# Validates extraction of type annotations

signal health_changed(new_value: int, old_value: int)
signal damage_taken(amount: float, source: Node)
signal player_died(cause: String)
signal item_collected(item_name: String, quantity: int, rarity: int)
signal quest_completed(quest_id: int, rewards: Array)
signal dialogue_started(speaker: Node, text: String, options: Array)
