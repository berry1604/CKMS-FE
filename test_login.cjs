const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            username: 'coordinator',
            password: 'coordinator'
        });
        console.log(JSON.stringify(loginRes.data, null, 2));
    } catch (err) {
        console.error("Login fail:", err.message);
    }
}
test();
