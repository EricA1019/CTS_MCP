## Static typed array parameters
extends Node

signal entities_spawned(entities: Array[Node])
signal positions_updated(coords: Array[Vector2])
signal inventory_changed(items: Array[String], quantities: Array[int])

func spawn_multiple(nodes: Array[Node]):
	entities_spawned.emit(nodes)
