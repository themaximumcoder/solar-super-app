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
        getImage: async function(tagValue) {
            console.log("Getting image for tagValue:", tagValue);
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
        img_toolbox: "",
        img_safety: "",
        img_inspection: "",
        img_skylift: "",
        img_sld: "",
        img_pvlayout: "",
        img_array: "",
        img_route: "",
        img_inverter: "",
        img_combiner: "",
        img_interconnection: "",
        img_housekeeping: ""
    };

    console.log("Rendering...");
    try {
        await doc.renderAsync(data);
        console.log("Render success!");
    } catch (e) {
        console.error("Render failed:", e);
        if (e.properties && e.properties.errors) {
            console.error("Detailed errors:", e.properties.errors);
        }
    }
}

run();
