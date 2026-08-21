const fs = require('fs');
const AdmZip = require('adm-zip');

const zip = new AdmZip('./public/work_completion_template.pptx');
const zipEntries = zip.getEntries();
const tags = new Set();

zipEntries.forEach(function (zipEntry) {
    if (zipEntry.entryName.endsWith('.xml')) {
        const content = zipEntry.getData().toString('utf8');
        // match {tag} or {tag } etc
        const matches = content.match(/\{[^}]+\}/g);
        if (matches) {
            matches.forEach(m => tags.add(m));
        }
    }
});

console.log("Found Tags:", Array.from(tags));
