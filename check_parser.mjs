import { parseGDScriptSignals } from './src/artifacts/parsers/gdscript_parser.js';

const fixtures = [
  'nested_classes',
  'multiline_params',
  'unicode_names',
];

fixtures.forEach(name => {
  const path = `./src/__tests__/fixtures/regression/${name}.gd`;
  const signals = parseGDScriptSignals(path);
  console.log(`\n=== ${name}.gd ===`);
  console.log(`Found ${signals.length} signals:`);
  signals.forEach(sig => {
    console.log(`  - ${sig.name} (line ${sig.line}): [${sig.params.join(', ')}]`);
  });
});
