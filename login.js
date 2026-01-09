// Simple login credentials (in a real app, this would be server-side)
const validCredentials = {
    username: 'One',
    password: '1234'
};

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Clear previous error
    errorMessage.classList.remove('show');
    
    // Validate credentials
    if (username === validCredentials.username && password === validCredentials.password) {
        // Store login session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', username);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        // Show error message
        errorMessage.textContent = 'தவறான பயனர் பெயர் அல்லது கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.';
        errorMessage.classList.add('show');
    }
});

// Set default date to today for order forms
window.addEventListener('load', function() {
    const today = new Date().toISOString().split('T')[0];
    // This will be used in dashboard
});
