const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            username: 'coordinator',
            password: 'coordinator'
        });
        const token = loginRes.data.accessToken;
        
        try {
            const ordersRes = await axios.get('http://localhost:8080/api/v1/orders/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("My Orders success:", ordersRes.data.content?.length);
        } catch (err) {
            console.error("My Orders fail:", err.response ? err.response.status : err.message);
            if (err.response) console.error(err.response.data);
        }
    } catch (err) {
        console.error("Login fail:", err.message);
    }
}
test();
