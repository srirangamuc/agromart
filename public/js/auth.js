const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

function validateEmail() {
    const email = emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex

    if (!emailRegex.test(email)) {
        emailError.innerText = 'Please enter a valid email address.';
    } else {
        emailError.innerText = ''; // Clear error if valid
    }
}

// Function to validate password
function validatePassword() {
    const password = passwordInput.value;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/; // At least 8 chars, 1 capital, 1 number

    if (!passwordRegex.test(password)) {
        passwordError.innerText = 'Password must be at least 8 characters long and include at least one capital letter and one number.';
    } else {
        passwordError.innerText = ''; // Clear error if valid
    }
}

// Add event listeners for live validation
emailInput.addEventListener('input', validateEmail);
passwordInput.addEventListener('input', validatePassword);

// Prevent form submission and validate on submit
// Prevent form submission and validate on submit
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    // Validate on submit
    validateEmail();
    validatePassword();

    // Check if the email is in admin format
    const email = emailInput.value;
    const adminEmailRegex = /^admin\d+@freshmart\.com$/; // Adjust the regex as needed
    const adminNotification = document.getElementById('admin-notification');

    if (adminEmailRegex.test(email)) {
        adminNotification.style.display = 'block'; // Show admin notification
        // Proceed with the form submission
        this.submit();
    } else {
        adminNotification.style.display = 'none'; // Hide admin notification
        // Check if there are any error messages
        if (!emailError.innerText && !passwordError.innerText) {
            this.submit(); // Submit the form if no errors
        }
    }
});
