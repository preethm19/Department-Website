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

  // Clear ALL authentication data
  localStorage.clear();

  // Also clear sessionStorage if used
  sessionStorage.clear();

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

  // Prevent browser from caching this logout action
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }

  // Force redirect with cache-busting and replace current history entry
  const logoutUrl = `http://localhost:3000/?logout=success&t=${Date.now()}`;
  window.location.replace(logoutUrl);
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
