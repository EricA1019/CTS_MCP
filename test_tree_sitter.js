import Parser from 'tree-sitter';
import GDScript from 'tree-sitter-gdscript';

console.log('Parser loaded:', !!Parser);
console.log('GDScript loaded:', !!GDScript);

const parser = new Parser();
parser.setLanguage(GDScript);

const tree = parser.parse('signal test_signal');
console.log('Parse successful!');
console.log('Root node type:', tree.rootNode.type);
console.log('Root node children:', tree.rootNode.childCount);
