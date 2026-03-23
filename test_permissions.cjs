const axios = require('axios');

async function testStoresAndShipments() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            email: 'coordinator@ckms.com',
            password: 'coordinator'
        });
        const token = loginRes.data?.data?.token || loginRes.data?.token;

        if (!token) {
            console.log("Login failed", loginRes.data);
            return;
        }

        console.log("Login success");

        // 2. Fetch stores
        try {
            const storesRes = await axios.get('http://localhost:8080/api/v1/stores?size=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("GET /stores status:", storesRes.status);
        } catch (err) {
            console.log("GET /stores error status:", err.response?.status);
            console.log("GET /stores err data:", err.response?.data);
        }

        // 3. Fetch shipments
        try {
            const shipmentsRes = await axios.get('http://localhost:8080/api/v1/shipments?page=0&size=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("GET /shipments status:", shipmentsRes.status);
        } catch (err) {
            console.log("GET /shipments error status:", err.response?.status);
            console.log("GET /shipments err data:", err.response?.data);
        }

    } catch (err) {
        if (err.response) {
            console.log("Login HTTP error:", err.response.status, err.response.data);
        } else {
            console.error(err);
        }
    }
}

testStoresAndShipments();
