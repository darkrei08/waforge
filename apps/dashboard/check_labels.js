const fs = require('fs');
const path = require('path');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const en = JSON.parse(fs.readFileSync('./locales/en.json', 'utf8'));
const it = JSON.parse(fs.readFileSync('./locales/it.json', 'utf8'));
const enKeys = new Set(getKeys(en));
const itKeys = new Set(getKeys(it));

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const usedKeys = new Set();
const regex = /(?:t|\$t)\(['"]([^'"]+)['"]\)/g;

['./pages', './components', './layouts'].forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, (filePath) => {
      if (filePath.endsWith('.vue')) {
        const content = fs.readFileSync(filePath, 'utf8');
        let match;
        while ((match = regex.exec(content)) !== null) {
          usedKeys.add(match[1]);
        }
      }
    });
  }
});

let missingEn = [];
let missingIt = [];

usedKeys.forEach(key => {
  if (!enKeys.has(key)) missingEn.push(key);
  if (!itKeys.has(key)) missingIt.push(key);
});

console.log("Missing in EN:", missingEn);
console.log("Missing in IT:", missingIt);
