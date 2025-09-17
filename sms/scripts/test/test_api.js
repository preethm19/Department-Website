const fetch = require('node-fetch');

async function testAPI() {
  const baseURL = process.env.MAIN_WEBSITE_URL || 'http://localhost:3000';
  const token = 'your_admin_token_here'; // You'll need to get this from browser

  console.log('Testing API endpoints...\n');

  try {
    // Test all users
    console.log('1. Testing /admin/users?userType=all');
    const response1 = await fetch(`${baseURL}/admin/users?userType=all`, {
      headers: { 'Authorization': token }
    });
    const data1 = await response1.json();
    console.log('All users:', data1.length, 'found');
    data1.forEach(user => console.log(`  - ${user.name} (${user.role})`));

    console.log('\n2. Testing /admin/users?userType=admins');
    const response2 = await fetch(`${baseURL}/admin/users?userType=admins`, {
      headers: { 'Authorization': token }
    });
    const data2 = await response2.json();
    console.log('Admins:', data2.length, 'found');
    data2.forEach(user => console.log(`  - ${user.name} (${user.role})`));

    console.log('\n3. Testing /admin/users?userType=students');
    const response3 = await fetch(`${baseURL}/admin/users?userType=students`, {
      headers: { 'Authorization': token }
    });
    const data3 = await response3.json();
    console.log('Students:', data3.length, 'found');
    data3.forEach(user => console.log(`  - ${user.name} (${user.role})`));

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: Make sure server is running and you have a valid admin token!');
  }
}

testAPI();
