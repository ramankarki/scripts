const fs = require('fs'); // eslint-disable-line
const path = require('path'); // eslint-disable-line

const lines = process.argv[3]?.split('\n') || [];
const NODE_ENV = process.argv[2];
const file = fs.createWriteStream(
  path.join(__dirname, '..', `${NODE_ENV}.env`),
);

lines.map((line) => {
  if (line === '{' || line === '}') return;
  line = line.trim().replace(':', '=').replace(' ', '');
  line = line.at(-1) === ',' ? line.slice(0, line.length - 1) : line;
  line = line.replace(/"/g, '');

  const nodeEnvUpper = NODE_ENV.toUpperCase();
  if (!line.startsWith(nodeEnvUpper)) return;
  const kv = line.replace(`${nodeEnvUpper}_`, '');
  file.write(kv + '\n');
});

file.close();
