# EventBus.gd - Sample fixture for testing signal parsing
extends Node

# Player signals
signal player_health_changed(old_health: int, new_health: int)
signal player_died(position: Vector2)
signal player_spawned(player_id: String)
signal player_level_up(new_level: int)

# Combat signals
signal damage_dealt(attacker: Node, target: Node, amount: int)
signal combat_started(participants: Array)
signal combat_ended(winner: Node)

# UI signals
signal ui_menu_opened(menu_type: String)
signal ui_notification(message: String, severity: String)
signal ui_tooltip_show(text: String, position: Vector2)

# System signals
signal game_paused()
signal game_resumed()
signal settings_changed(settings: Dictionary)

# Quest signals
signal quest_started(quest_id: String)
signal quest_completed(quest_id: String, rewards: Array)
signal quest_failed(quest_id: String)

# Inventory signals
signal item_added(item: Resource, quantity: int)
signal item_removed(item: Resource, quantity: int)
signal inventory_full()
