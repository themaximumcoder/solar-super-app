const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');

const content = fs.readFileSync('src/templates/template.docx', 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
});

doc.render({
    siteName: 'MHS_TEST_123',
    customerName: 'John Doe',
    address: '123 Fake Street',
    systemSize: '10.5 kWp',
    startDate: '2026-01-01',
    endDate: '2026-01-02',
    picName: 'Engineer Bob',
    serialNumbers: 'SN123, SN456, SN789',
    clinicName: 'Test Clinic',
    clinicPhone: '123456789',
    hospitalName: 'Test Hospital',
    hospitalPhone: '987654321',
    policeName: 'Test Police',
    policePhone: '111222333',
    fireName: 'Test Fire',
    firePhone: '444555666'
});

const buf = doc.getZip().generate({ type: 'nodebuffer' });
fs.writeFileSync('test_output.docx', buf);
console.log('Generated test_output.docx');
