const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

async function run() {
    const templatePath = path.join(__dirname, 'src', 'templates', 'template.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const emptyPixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

    const imageOptions = {
        centered: false,
        getImage: function(tagValue) {
            if (Buffer.isBuffer(tagValue)) return tagValue;
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
        siteName: "TestSite",
        img_toolbox: emptyPixel,
        img_safety: emptyPixel,
        img_inspection: emptyPixel,
        img_skylift: emptyPixel,
        img_sld: emptyPixel,
        img_pvlayout: emptyPixel,
        img_array: emptyPixel,
        img_route: emptyPixel,
        img_inverter: emptyPixel,
        img_combiner: emptyPixel,
        img_interconnection: emptyPixel,
        img_housekeeping: emptyPixel
    };

    console.log("Rendering synchronously...");
    try {
        doc.render(data);
        console.log("Render success!");
    } catch (e) {
        console.error("Render failed:", e);
        if (e.properties && e.properties.errors) {
            console.error("Detailed errors:", e.properties.errors);
        }
    }
}

run();
