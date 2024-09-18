// Function to fetch products and update the DOM
async function fetchProducts() {
    try {
        const response = await fetch('/vendor/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const products = await response.json();
        const productsList = document.getElementById('productsList');
        
        // Clear the list before adding new items
        productsList.innerHTML = '';

        // Add each product to the list
        products.forEach(product => {
            const listItem = document.createElement('li');
            listItem.textContent = `${product.name} - ${product.quantity} kg - $${product.pricePerKg.toFixed(2)} per kg`;
            productsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '<li>Error loading products</li>';
    }
}

// Fetch products when the page loads
document.addEventListener('DOMContentLoaded', fetchProducts);
