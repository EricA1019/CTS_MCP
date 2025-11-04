/**
 * Type declarations for tree-sitter-gdscript
 * 
 * tree-sitter-gdscript doesn't include TypeScript definitions,
 * so we declare the module to satisfy TypeScript strict mode.
 */
declare module 'tree-sitter-gdscript' {
  import { Language } from 'tree-sitter';
  const grammar: Language;
  export default grammar;
}
