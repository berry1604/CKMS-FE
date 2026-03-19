const fs = require('fs');
const token = fs.readFileSync('/Users/phunghuyphuoc/.gemini/antigravity/brain/cbb8f05a-171f-4ac4-8ab4-2cedd0562f23/.system_generated/logs/overview.txt', 'utf8').match(/"accessToken":"([^"]+)"/)[1];

fetch('http://localhost:8080/api/v1/production-plans/11', { // Using ID 11 from the screenshot
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(e => console.error(e));
