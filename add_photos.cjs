const fs = require('fs');
const content = fs.readFileSync('src/data/tenants.js', 'utf8');
const lines = content.split('\n');
const result = lines.map(line => {
  if (!line.includes('id:') || !line.includes('moveIn:')) return line;
  if (line.includes('name: "퇴실"') || line.includes('name: "미노출"') || line.includes('name: "건물주"') || line.includes('moveIn: ""')) return line;
  if (line.includes('moveInPhotos')) return line;
  const idMatch = line.match(/id: (\d+)/);
  const id = idMatch ? parseInt(idMatch[1]) : 0;
  const count = 3 + (id % 6);
  const photos = Array.from({length: count}, (_, i) => '"p' + (i+1) + '"').join(',');
  return line.replace(/ },/, ', moveInPhotos: [' + photos + '] },');
});
fs.writeFileSync('src/data/tenants.js', result.join('\n'));
console.log('Done');
