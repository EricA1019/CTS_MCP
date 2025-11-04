## Dictionary-typed parameters with type hints
extends Node

signal config_loaded(config: Dictionary)
signal settings_changed(old_settings: Dictionary, new_settings: Dictionary)
signal json_data_received(data: Dictionary, source: String)

func load_config():
	var cfg = {"resolution": Vector2(1920, 1080), "fullscreen": true}
	config_loaded.emit(cfg)
