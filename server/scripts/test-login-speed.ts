import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function runTest() {
  try {
    console.log("1. Registering test user...");
    const registerRes = await axios.post(`${API_URL}/api/auth/register`, {
      name: "Test User Speed",
      whatsapp: "5511988887777",
      device: "test",
      email: "test_speed@example.com",
      password: "password123"
    }).catch(err => {
      if (err.response && err.response.status === 409) {
         console.log("   User already exists (409). Continuing with Login test.");
         return { data: { success: true } }; // Fake success for flow
      }
      throw err;
    });
    
    console.log("Register Response:", registerRes.data);

    console.log("\n2. Logging in test user...");
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: "test_speed@example.com",
      password: "password123"
    });
    
    console.log("Login Response Status:", loginRes.status);
    console.log("Login Success:", loginRes.data.success);

    console.log("\n✅ Test finished. Check server logs for Performance data.");

  } catch (err: any) {
    console.error("Test Error:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
  } finally {
    process.exit(0);
  }
}

runTest();
