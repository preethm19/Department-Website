document.getElementById('logout').addEventListener('click', async () => {
  // Disable logout button to prevent double-clicks
  const logoutButton = document.getElementById('logout');
  const originalText = logoutButton.textContent;
  logoutButton.disabled = true;
  logoutButton.textContent = 'Logging out...';

  try {
    // Call logout endpoint to invalidate token server-side
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/logout', {
          method: 'POST',
          headers: { 'Authorization': token }
        });
        console.log('Server-side logout successful');
      } catch (error) {
        console.error('Logout API call failed:', error);
        // Continue with client-side cleanup even if server call fails
      }
    }
  } catch (error) {
    console.error('Logout error:', error);
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

  // Unregister service workers to prevent caching issues
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }

  // Small delay to ensure all cleanup is complete
  setTimeout(() => {
    // Fetch the main website URL and redirect with cache-busting
    fetch('/config')
      .then(response => response.json())
      .then(config => {
        const logoutUrl = `${config.mainWebsiteUrl}/?logout=success&t=${Date.now()}`;
        window.location.replace(logoutUrl);
      })
      .catch(error => {
        console.error('Failed to fetch config:', error);
        // Fallback to localhost for development
        const logoutUrl = `http://localhost:3000/?logout=success&t=${Date.now()}`;
        window.location.replace(logoutUrl);
      });
  }, 100);
});

// Semester selector
const semesterSelect = document.getElementById('semesterSelect');
if (semesterSelect) {
  // Load saved semester
  const savedSemester = localStorage.getItem('selectedSemester') || 'all';
  semesterSelect.value = savedSemester;

  // Save semester on change
  semesterSelect.addEventListener('change', function () {
    localStorage.setItem('selectedSemester', this.value);
  });
}
