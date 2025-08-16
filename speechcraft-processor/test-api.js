require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY;

console.log('🧪 Testing SpeechCraft Processing Server');
console.log('=======================================\n');

async function testHealthEndpoint() {
  try {
    console.log('1. Testing Health Endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    
    console.log('✅ Health check passed');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    console.log('');
    
    return true;
  } catch (error) {
    console.log('❌ Health check failed');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    console.log('');
    return false;
  }
}

async function testProcessEndpoint() {
  try {
    console.log('2. Testing Process Endpoint...');
    
    if (!API_KEY) {
      console.log('❌ API_KEY not found in environment variables');
      console.log('Please set API_KEY in your .env file');
      return false;
    }

    const testPayload = {
      noteId: '123e4567-e89b-12d3-a456-426614174000', // Example UUID
      noteType: 'general'
    };

    const response = await axios.post(`${BASE_URL}/api/process`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });
    
    console.log('✅ Process endpoint test passed');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    console.log('');
    
    return true;
  } catch (error) {
    console.log('❌ Process endpoint test failed');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    console.log('');
    return false;
  }
}

async function testInvalidApiKey() {
  try {
    console.log('3. Testing Invalid API Key...');
    
    const testPayload = {
      noteId: '123e4567-e89b-12d3-a456-426614174000',
      noteType: 'general'
    };

    const response = await axios.post(`${BASE_URL}/api/process`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'invalid-key'
      }
    });
    
    console.log('❌ Should have failed with invalid API key');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Invalid API key correctly rejected');
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
      console.log('');
      return true;
    } else {
      console.log('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testMissingApiKey() {
  try {
    console.log('4. Testing Missing API Key...');
    
    const testPayload = {
      noteId: '123e4567-e89b-12d3-a456-426614174000',
      noteType: 'general'
    };

    const response = await axios.post(`${BASE_URL}/api/process`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
        // No x-api-key header
      }
    });
    
    console.log('❌ Should have failed with missing API key');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Missing API key correctly rejected');
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
      console.log('');
      return true;
    } else {
      console.log('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function runTests() {
  console.log(`Testing server at: ${BASE_URL}`);
  console.log(`Using API Key: ${API_KEY ? 'Set' : 'Not Set'}\n`);
  
  const results = [];
  
  results.push(await testHealthEndpoint());
  results.push(await testProcessEndpoint());
  results.push(await testInvalidApiKey());
  results.push(await testMissingApiKey());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('=======================================');
  console.log('📊 Test Results');
  console.log('=======================================');
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.');
  }
  
  console.log('\n💡 Note: The process endpoint test will likely fail if:');
  console.log('   - Supabase is not configured');
  console.log('   - OpenAI API key is not set');
  console.log('   - The test noteId doesn\'t exist in your database');
  console.log('\nThis is expected for initial setup testing.');
}

// Run the tests
runTests().catch(console.error);