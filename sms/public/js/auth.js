// Common Authentication Script for SMS Pages
(function() {
  // Enhanced authentication check with frequent validation
  function checkAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Check if we're on a student or admin page
    const isStudentPage = window.location.pathname.includes('/student/');
    const isAdminPage = window.location.pathname.includes('/admin/');

    // Always redirect if no authentication data
    if (!token || !role) {
      console.log('No authentication data found, redirecting to main website');
      clearAllAuthData();
      // Fetch main website URL and redirect
      fetch('/config')
        .then(response => response.json())
        .then(config => {
          window.location.replace(config.mainWebsiteUrl);
        })
        .catch(error => {
          console.error('Failed to fetch config:', error);
          window.location.replace('http://localhost:3000/');
        });
      return false;
    }

    // Check role consistency
    if (isStudentPage && role !== 'student') {
      console.log('Wrong role for student page, redirecting');
      clearAllAuthData();
      // Fetch main website URL and redirect
      fetch('/config')
        .then(response => response.json())
        .then(config => {
          window.location.replace(config.mainWebsiteUrl);
        })
        .catch(error => {
          console.error('Failed to fetch config:', error);
          window.location.replace('http://localhost:3000/');
        });
      return false;
    }

    if (isAdminPage && role !== 'admin') {
      console.log('Wrong role for admin page, redirecting');
      clearAllAuthData();
      // Fetch main website URL and redirect
      fetch('/config')
        .then(response => response.json())
        .then(config => {
          window.location.replace(config.mainWebsiteUrl);
        })
        .catch(error => {
          console.error('Failed to fetch config:', error);
          window.location.replace('http://localhost:3000/');
        });
      return false;
    }

    return true;
  }

  function clearAllAuthData() {
    localStorage.clear();
    sessionStorage.clear();
  }

  // Initial authentication check
  if (!checkAuthentication()) {
    return; // Stop execution if not authenticated
  }

  // Set up periodic authentication checks
  setInterval(checkAuthentication, 5000); // Check every 5 seconds

  // Check authentication on page visibility change (when user switches tabs)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      checkAuthentication();
    }
  });

  // Check authentication before any navigation
  window.addEventListener('beforeunload', function() {
    // This helps prevent cached pages from loading
  });

  // Override browser back/forward navigation
  window.addEventListener('popstate', function(event) {
    // Force a fresh authentication check on navigation
    setTimeout(checkAuthentication, 100);
  });

  // Prevent browser from caching this page
  window.addEventListener('load', function() {
    // Force page refresh if loaded from cache
    if (performance.getEntriesByType('navigation')[0].type === 'back_forward') {
      window.location.reload();
    }
  });
})();

// Page load authentication check
document.addEventListener('DOMContentLoaded', function() {
  // Register service worker for basic functionality
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js')
      .then(registration => {
        console.log('Service Worker registered');
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  }

  // Allow normal browser navigation - server will validate authentication on API requests
  // No need to block back/forward buttons or manipulate history
});
