const cfAccount = '438e14c26856b48f8104387a2f1589f3';
const cfToken1 = 'cfut_f7PcQUrFDaifcJOhFbd';
const cfToken2 = 'hanYXyFzHBBuZnIL5v4xcedfa12d2';
const cfToken = cfToken1 + cfToken2;

const payload = {
    prompt: "Return the word SUCCESS",
};

fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${cfToken}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
}).then(r => r.json()).then(data => console.log(JSON.stringify(data))).catch(console.error);
