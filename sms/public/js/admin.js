document.getElementById('logout').addEventListener('click', async () => {
  try {
    // Call logout endpoint to invalidate token server-side
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/logout', {
        method: 'POST',
        headers: { 'Authorization': token }
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  }

  // Clear SMS authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('role');

  // Clear shared authentication data
  localStorage.removeItem('sms_token');
  localStorage.removeItem('sms_role');
  localStorage.removeItem('user_usn');

  // Clear browser cache to prevent back button access
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }

  // Clear service worker cache
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_CACHE'
    });
  }

  // Redirect back to main website with logout flag
  window.location.href = 'http://localhost:8080/?logout=success';
});

// Semester selector
const semesterSelect = document.getElementById('semesterSelect');
if (semesterSelect) {
  // Load saved semester
  const savedSemester = localStorage.getItem('selectedSemester') || 'all';
  semesterSelect.value = savedSemester;

  // Save semester on change
  semesterSelect.addEventListener('change', function() {
    localStorage.setItem('selectedSemester', this.value);
  });
}
