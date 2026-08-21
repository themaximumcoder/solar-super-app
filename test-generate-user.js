const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const emptyPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

async function run() {
    const templatePath = path.join(__dirname, 'src', 'templates', 'template.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const imageOptions = {
        centered: false,
        getImage: function(tagValue) {
            return emptyPixel;
        },
        getSize: function() {
            return [300, 225];
        }
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule]
    });

    const data = {
        siteName: "MHS_1234",
        customerName: "Test Name",
        address: "Test Address",
        img_toolbox: "dummy",
        img_safety: "dummy",
        img_inspection: "dummy",
        img_skylift: "dummy",
        img_sld: "dummy",
        img_pvlayout: "dummy",
        img_array: "dummy",
        img_route: "dummy",
        img_inverter: "dummy",
        img_combiner: "dummy",
        img_interconnection: "dummy",
        img_housekeeping: "dummy"
    };

    console.log("Rendering...");
    try {
        doc.setData(data);
        doc.render();
        console.log("Render success!");
        const buf = doc.getZip().generate({ type: 'nodebuffer' });
        fs.writeFileSync('output_test.docx', buf);
        console.log("File written to output_test.docx");
    } catch (e) {
        console.error("Render failed:");
        console.error(e.stack);
        if (e.properties && e.properties.errors) {
            console.error("Detailed errors:", e.properties.errors);
        }
    }
}

run();
