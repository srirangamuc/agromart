document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/customer/products'); // Ensure this route exists in your backend
        if (response.ok) {
            const products = await response.json();
            const productsList = document.getElementById('productsList');
            products.forEach(product => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <h3>${product.name}</h3>
                    <p>Available Quantity: ${product.quantity} kg</p>
                    <p>Price per kg: $${product.pricePerKg}</p>
                    <label for="quantity-${product._id}">Quantity to Buy:</label>
                    <input type="number" id="quantity-${product._id}" name="quantity" min="1" max="${product.quantity}" step="0.01" required>
                    <button onclick="buyProduct('${product._id}', ${product.pricePerKg})">Buy</button>
                `;
                productsList.appendChild(listItem);
            });
        } else {
            console.error('Failed to fetch products');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

async function buyProduct(productId, pricePerKg) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseFloat(quantityInput.value);

    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    // Redirect or open a modal for Stripe payment
    window.location.href = `/checkout/${productId}?quantity=${quantity}&pricePerKg=${pricePerKg}`;
}
