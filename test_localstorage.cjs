// This script simulates what the frontend receives from the login API 
const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            username: 'coordinator',
            password: 'coordinator'
        });
        const response = loginRes.data;
        const responseAny = response;
        let userRole = responseAny.roleName || (response.roles && response.roles.length > 0 ? response.roles[0] : '');
        console.log("Extracted Role:", userRole);
    } catch (err) {
        console.error("Login fail:", err.message);
    }
}
test();
