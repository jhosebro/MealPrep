const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const result = execSync(
    'grep -rl "OTEL_PKG" node_modules --include="*.js" --include="*.cjs" --include="*.mjs" 2>/dev/null',
    { encoding: 'utf8' }
  );
  
  const files = result.trim().split('\n').filter(Boolean);
  
  files.forEach(file => {
    console.log('Patching:', file);
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /import\(\/\*[^*]*\*\/\s*OTEL_PKG\)/g,
      'Promise.resolve({})'
    );
    fs.writeFileSync(file, content);
  });
  
  console.log('OTEL patch applied to', files.length, 'files');
} catch (e) {
  console.log('No OTEL files found, skipping patch');
}
