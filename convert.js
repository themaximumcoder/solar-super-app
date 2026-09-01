const fs = require('fs');
const md = fs.readFileSync('C:\\Users\\banan\\.gemini\\antigravity\\brain\\d3a59669-4536-4d42-94ed-6bc6fe43159b\\handover_manual.md', 'utf8');

// VERY basic md to html since no libs are available immediately
let html = md
  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
  .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/gim, '<em>$1</em>')
  .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
  .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
  .replace(/\n\n/gim, '<br/><br/>');

const output = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Handover Manual</title></head>
<body>${html}</body>
</html>
`;

fs.writeFileSync('C:\\Users\\banan\\.gemini\\antigravity\\brain\\d3a59669-4536-4d42-94ed-6bc6fe43159b\\handover_manual.doc', output);
