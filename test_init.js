import Parser from 'tree-sitter';
import GDScript from 'tree-sitter-gdscript';

let parser = null;
let initPromise = null;

async function initTreeSitter() {
  console.log('1. initTreeSitter() called');
  
  // Return immediately if already initialized
  if (parser) {
    console.log('2. Parser already exists, returning early');
    return;
  }

  // Wait for ongoing initialization if one exists
  if (initPromise) {
    console.log('3. Init already in progress, waiting...');
    return initPromise;
  }

  console.log('4. Starting new initialization');
  
  // Start new initialization
  initPromise = (async () => {
    console.log('5. Inside init promise');
    const startTime = Date.now();

    try {
      console.log('6. Creating parser...');
      parser = new Parser();
      console.log('7. Parser created');

      console.log('8. Setting language...');
      parser.setLanguage(GDScript);
      console.log('9. Language set');

      const initTime = Date.now() - startTime;
      console.log(`10. Init complete in ${initTime}ms`);
    } catch (error) {
      console.error('ERROR during init:', error);
      parser = null;
      initPromise = null;
      throw error;
    }
  })();

  console.log('11. Waiting for init promise...');
  await initPromise;
  console.log('12. Init promise resolved');
}

console.log('Starting test...');
initTreeSitter()
  .then(() => console.log('SUCCESS: initTreeSitter completed'))
  .catch(err => console.error('FAILED:', err));
