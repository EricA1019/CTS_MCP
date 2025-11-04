## Node-typed parameters with specific classes
extends Node

signal child_added(child: Node2D)
signal ui_element_created(element: Control)
signal collision_detected(body: RigidBody2D, normal: Vector2)

func add_sprite(sprite: Sprite2D):
	add_child(sprite)
	child_added.emit(sprite)
