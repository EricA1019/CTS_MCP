extends Node
# Global EventBus for game-wide signals
# autoload/EventBus.gd

signal game_started
signal game_paused(is_paused: bool)
signal game_over(final_score: int, victory: bool)
signal level_changed(old_level: int, new_level: int)
signal player_spawned(player: Node)
signal enemy_defeated(enemy_type: String, position: Vector2)
