const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            username: 'coordinator',
            password: 'coordinator' // Wait, DataSeeder says password is 'coordinator' 
        });
        const token = loginRes.data.accessToken;
        console.log("Token:", token.substring(0, 20) + "...");
        
        try {
            const ordersRes = await axios.get('http://localhost:8080/api/v1/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Orders success:", ordersRes.data.content?.length);
        } catch (err) {
            console.error("Orders fail:", err.response ? err.response.status : err.message);
            if (err.response) console.error(err.response.data);
        }
    } catch (err) {
        console.error("Login fail:", err.message);
    }
}
test();
