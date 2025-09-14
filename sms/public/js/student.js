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
});
