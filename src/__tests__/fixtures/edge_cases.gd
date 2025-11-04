extends Node

# Edge cases: comments, whitespace, unusual formatting

# This is NOT a signal (commented out)
# signal commented_signal(value: int)

signal   weird_spacing  (  param1 :  int  ,  param2:String)

signal trailing_comma(a: int, b: int,)

# Signal with comment on same line
signal inline_comment(value: int) # health value

	signal indented_signal(x: float)

signal no_params
signal no_params_with_parens()
