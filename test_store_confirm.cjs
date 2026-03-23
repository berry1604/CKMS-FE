const axios = require('axios');

async function testStoreConfirm() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
            username: 'storestaff',
            password: 'staff'
        });
        const token = loginRes.data?.data?.token || loginRes.data?.token || loginRes.data?.accessToken;

        if (!token) {
            console.log("Login failed", loginRes.data);
            return;
        }

        console.log("Login success for store staff");

        // 2. Fetch shipments
        let shipmentId = null;
        try {
            const shipmentsRes = await axios.get('http://localhost:8080/api/v1/shipments?page=0&size=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const shipments = shipmentsRes.data?.data?.content || [];
            const inTransit = shipments.find(s => s.status === 'IN_TRANSIT');
            if (inTransit) {
                shipmentId = inTransit.shipmentId;
                console.log("Found IN_TRANSIT shipment ID:", shipmentId);
            } else if (shipments.length > 0) {
                shipmentId = shipments[0].shipmentId;
                console.log(`No IN_TRANSIT shipment found, trying with ${shipments[0].status} shipment ID:`, shipmentId);
            }
        } catch (err) {
            console.log("GET /shipments error:", err.response?.status, err.response?.data);
            return;
        }

        if (!shipmentId) {
            console.log("No shipments to test confirm");
            return;
        }

        // 3. Confirm delivery
        try {
            const confirmRes = await axios.patch(`http://localhost:8080/api/v1/shipments/${shipmentId}/confirm`, {
                note: "test", receivedQuantities: {}
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("PATCH /confirm status:", confirmRes.status);
        } catch (err) {
            console.log("PATCH /confirm error status:", err.response?.status);
            console.log("PATCH /confirm err data:", err.response?.data);
        }

    } catch (err) {
        console.log("Error:", err.message);
    }
}

testStoreConfirm();
