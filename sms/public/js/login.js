document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (response.ok) {
    console.log('Login successful - Token:', !!data.token, 'Role:', data.role);

    // Store both token and role
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);

    // Also store in shared keys for cross-site compatibility
    localStorage.setItem('sms_token', data.token);
    localStorage.setItem('sms_role', data.role);

    console.log('Stored in localStorage - Token:', !!localStorage.getItem('token'), 'Role:', localStorage.getItem('role'));

    if (data.role === 'student') {
      console.log('Redirecting to student dashboard');
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      window.location.href = `student/dashboard.html?t=${timestamp}`;
    } else {
      console.log('Redirecting to admin dashboard');
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      window.location.href = `admin/dashboard.html?t=${timestamp}`;
    }
  } else {
    console.log('Login failed:', data.error);
    document.getElementById('message').innerText = data.error;
  }
});
