## PackedScene and Resource-typed parameters
extends Node

signal scene_loaded(scene: PackedScene)
signal resource_applied(resource: Resource, target: Node)
signal texture_changed(old_tex: Texture2D, new_tex: Texture2D)

func load_scene(path: String):
	var scene = load(path) as PackedScene
	scene_loaded.emit(scene)
