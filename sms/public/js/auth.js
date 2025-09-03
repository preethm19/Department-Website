// Common Authentication Script for SMS Pages
(function() {
  // Immediate authentication check before anything loads
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Check if we're on a student or admin page
  const isStudentPage = window.location.pathname.includes('/student/');
  const isAdminPage = window.location.pathname.includes('/admin/');

  if (!token || !role) {
    // No token or role found, redirect to login
    clearAllAuthData();
    window.location.replace('http://localhost:8080/');
    return;
  }

  if (isStudentPage && role !== 'student') {
    // Wrong role for student page
    clearAllAuthData();
    window.location.replace('http://localhost:8080/');
    return;
  }

  if (isAdminPage && role !== 'admin') {
    // Wrong role for admin page
    clearAllAuthData();
    window.location.replace('http://localhost:8080/');
    return;
  }

  // Verify token is still valid with server
  fetch('/profile', {
    headers: { 'Authorization': token },
    cache: 'no-cache'
  })
  .then(response => {
    if (!response.ok) {
      // Token is invalid, clear it and redirect
      clearAllAuthData();
      window.location.replace('http://localhost:8080/');
      return;
    }
    // Token is valid, continue loading page
    console.log('Authentication successful');
  })
  .catch(error => {
    console.error('Auth check failed:', error);
    // On error, clear tokens and redirect
    clearAllAuthData();
    window.location.replace('http://localhost:8080/');
  });

  function clearAllAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_role');
    localStorage.removeItem('user_usn');

    // Clear browser cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  }
})();

// Page load authentication check
document.addEventListener('DOMContentLoaded', function() {
  // Register service worker for security
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js')
      .then(registration => {
        console.log('Service Worker registered');
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  }

  // Prevent browser back button access
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      // Page was loaded from cache, force refresh
      window.location.reload(true);
    }
  });

  // Replace current history entry to prevent back navigation
  if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
  }

  // Clear cache on page unload
  window.addEventListener('beforeunload', function() {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  });

  // Additional protection: Clear localStorage on visibility change
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      // Page is hidden, clear cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
    }
  });

  // Additional check for cached pages
  if (performance.getEntriesByType('navigation')[0].type === 'back_forward') {
    // This was a back/forward navigation, force authentication check
    setTimeout(function() {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const isStudentPage = window.location.pathname.includes('/student/');
      const isAdminPage = window.location.pathname.includes('/admin/');

      if (!token || !role ||
          (isStudentPage && role !== 'student') ||
          (isAdminPage && role !== 'admin')) {
        window.location.replace('http://localhost:8080/');
      }
    }, 50);
  }
});
