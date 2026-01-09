// Check if user is logged in
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

let cart = [];
let currentCategory = 'sweet';
let searchTerm = '';
let editingOrderId = null;

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    params.forEach((v, k) => out[k] = v);
    return out;
}

document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();
    
    document.querySelectorAll('.menu-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            loadMenuItems(currentCategory);
        });
    });
    
    document.getElementById('productSearch').addEventListener('input', function(e) {
        searchTerm = e.target.value.toLowerCase();
        loadMenuItems(currentCategory);
    });
    
    document.getElementById('checkoutBtn').addEventListener('click', function() {
        if (cart.length > 0) {
            openCheckoutModal();
        }
    });
    
    document.getElementById('checkoutForm').addEventListener('submit', function(e) {
        e.preventDefault();
        placeOrder();
    });
    
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('checkoutModal').style.display = 'none';
    });
    
    // Update remaining amount when advance amount changes
    document.addEventListener('input', function(e) {
        if (e.target.id === 'checkoutAdvanceAmount') {
            updatePaymentSummary();
        }
    });
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkoutOrderDate').value = today;
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        window.location.href = 'index.html';
    });
});

// Initialize edit mode if present
(function initEditMode() {
    document.addEventListener('DOMContentLoaded', function() {
        const qp = getQueryParams();
        if (qp.edit) {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const id = parseInt(qp.edit, 10);
            const order = orders.find(o => o.id === id);
            if (!order || order.isDelivered) return;
            editingOrderId = id;
            // Preload cart
            cart = (order.items || []).map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, count: i.count || 1 }));
            updateCartDisplay();
            // Preload form fields
            document.getElementById('checkoutCustomerName').value = order.customerName || '';
            document.getElementById('checkoutPhone1').value = order.phone1 || '';
            document.getElementById('checkoutPhone2').value = order.phone2 || '';
            document.getElementById('checkoutOrderDate').value = order.orderDate || '';
            document.getElementById('checkoutDeliveryDate').value = order.deliveryDate || '';
            const paymentModeSelect = document.getElementById('checkoutPaymentMode');
            if (paymentModeSelect) paymentModeSelect.value = order.paymentMode || 'Cash';
            const adv = order.advanceAmount || 0;
            const advInput = document.getElementById('checkoutAdvanceAmount');
            if (advInput) advInput.value = adv;
            updatePaymentSummary();
            // Change button text
            const btn = document.getElementById('checkoutBtn');
            if (btn) btn.textContent = 'திருத்த செக்கவுட்டுக்கு செல்ல';
            const submitBtn = document.querySelector('#checkoutForm .submit-btn');
            if (submitBtn) submitBtn.textContent = 'மாற்றங்களைச் சேமி';
        }
    });
})();

function getProducts() {
    const products = localStorage.getItem('products');
    return products ? JSON.parse(products) : [];
}

function loadMenuItems(category = 'sweet') {
    const products = getProducts();
    let filteredProducts = products.filter(p => p.type === category);
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm)
        );
    }
    
    const menuItems = document.getElementById('menuItems');
    
    if (filteredProducts.length === 0) {
        const categoryName = category === 'sweet' ? 'இனிப்பு' : 'காரம்';
        menuItems.innerHTML = `<p class="empty-menu">${categoryName} பொருட்கள் எதுவும் கிடைக்கவில்லை. தயாரிப்புகள் பக்கத்தில் பொருட்களைச் சேர்க்கவும்.</p>`;
        return;
    }
    
    menuItems.innerHTML = filteredProducts.map(product => `
        <div class="menu-item-card">
            <div class="menu-item-info">
                <h3>${escapeHtml(product.name)}</h3>
                <p class="menu-item-price">₹${product.price.toFixed(2)} / 1 கிலோ</p>
            </div>
            <div class="menu-item-actions">
                <select class="qty-selector" id="qty-${product.id}">
                    <option value="0.25">1/4 கிலோ</option>
                    <option value="0.5">1/2 கிலோ</option>
                    <option value="0.75">3/4 கிலோ</option>
                    <option value="1" selected>1 கிலோ</option>
                </select>
                <button class="add-to-cart-btn" onclick="addToCartWithQuantity(${product.id}, '${escapeHtml(product.name)}', ${product.price})">
                    கார்ட்டில் சேர்
                </button>
            </div>
        </div>
    `).join('');
}

function addToCartWithQuantity(productId, productName, price) {
    const qtySelector = document.getElementById(`qty-${productId}`);
    const quantity = parseFloat(qtySelector.value);
    
    const existingItem = cart.find(item => item.id === productId && item.quantity === quantity);
    
    if (existingItem) {
        existingItem.count = (existingItem.count || 1) + 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: quantity,
            count: 1
        });
    }
    
    updateCartDisplay();
}

function updateQuantity(productId, quantity, change) {
    const item = cart.find(item => item.id === productId && item.quantity === quantity);
    if (item) {
        item.count = (item.count || 1) + change;
        if (item.count <= 0) {
            removeFromCart(productId, quantity);
        } else {
            updateCartDisplay();
        }
    }
}

function removeFromCart(productId, quantity) {
    cart = cart.filter(item => !(item.id === productId && item.quantity === quantity));
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">கார்ட்டு காலியாக உள்ளது</p>';
        cartTotal.textContent = '₹0';
        checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        const count = item.count || 1;
        const quantityText = item.quantity === 0.25 ? '1/4' : item.quantity === 0.5 ? '1/2' : item.quantity === 0.75 ? '3/4' : item.quantity;
        const itemTotal = item.price * item.quantity * count;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>₹${item.price.toFixed(2)} × ${quantityText} கிலோ × ${count} = ₹${itemTotal.toFixed(2)}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity}, -1)">-</button>
                    <span class="qty-value">${count}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id}, ${item.quantity})">நீக்கு</button>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = `₹${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const summary = document.getElementById('checkoutSummary');
    const total = document.getElementById('checkoutTotal');
    
    let totalAmount = 0;
    summary.innerHTML = cart.map(item => {
        const count = item.count || 1;
        const quantityText = item.quantity === 0.25 ? '1/4' : item.quantity === 0.5 ? '1/2' : item.quantity === 0.75 ? '3/4' : item.quantity;
        const itemTotal = item.price * item.quantity * count;
        totalAmount += itemTotal;
        return `
            <div class="summary-item">
                <span>${escapeHtml(item.name)} (${quantityText} கிலோ × ${count})</span>
                <span>₹${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    total.innerHTML = `<strong>₹${totalAmount.toFixed(2)}</strong>`;
    
    // Reset advance amount only if not in edit mode
    if (!editingOrderId) {
        document.getElementById('checkoutAdvanceAmount').value = '0';
    }
    updatePaymentSummary(totalAmount);
    
    modal.style.display = 'block';
}

function updatePaymentSummary(totalAmount = null) {
    if (totalAmount === null) {
        // Calculate total from cart if not provided
        totalAmount = 0;
        cart.forEach(item => {
            const count = item.count || 1;
            totalAmount += item.price * item.quantity * count;
        });
    }
    
    const advanceAmount = parseFloat(document.getElementById('checkoutAdvanceAmount').value) || 0;
    const remainingAmount = Math.max(0, totalAmount - advanceAmount);
    
    document.getElementById('paymentTotalAmount').textContent = `₹${totalAmount.toFixed(2)}`;
    document.getElementById('paymentAdvanceAmount').textContent = `₹${advanceAmount.toFixed(2)}`;
    document.getElementById('paymentRemainingAmount').innerHTML = `<strong>₹${remainingAmount.toFixed(2)}</strong>`;
}

function placeOrder() {
    const customerName = document.getElementById('checkoutCustomerName').value.trim();
    const phone1 = document.getElementById('checkoutPhone1').value.trim();
    const phone2 = document.getElementById('checkoutPhone2').value.trim();
    const orderDate = document.getElementById('checkoutOrderDate').value;
    const deliveryDate = document.getElementById('checkoutDeliveryDate').value;
    const paymentMode = document.getElementById('checkoutPaymentMode').value;
    const advanceAmount = parseFloat(document.getElementById('checkoutAdvanceAmount').value) || 0;

    if (!/^\d{10}$/.test(phone1)) {
        alert('செல்லுபடியாகும் 10 இலக்க முதன்மை தொலைபேசி எண்ணை உள்ளிடவும்.');
        return;
    }
    if (new Date(deliveryDate) < new Date(orderDate)) {
        alert('விநியோக தேதி ஆர்டர் தேதிக்குப் பிறகு அல்லது சமமாக இருக்க வேண்டும்!');
        return;
    }

    let totalAmount = 0;
    cart.forEach(item => {
        const count = item.count || 1;
        totalAmount += item.price * item.quantity * count;
    });

    if (advanceAmount > totalAmount) {
        alert('முன்பணம் மொத்த தொகையை விட அதிகமாக இருக்கக்கூடாது!');
        return;
    }

    const remainingAmount = totalAmount - advanceAmount;

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');

    // Check if we're editing an existing order
    if (editingOrderId) {
        const idx = orders.findIndex(o => o.id === editingOrderId);
        if (idx !== -1) {
            const old = orders[idx];
            orders[idx] = {
                ...old,
                customerName,
                phone1,
                phone2,
                orderDate,
                deliveryDate,
                paymentMode,
                items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity, count: item.count || 1 })),
                totalAmount,
                advanceAmount,
                remainingAmount,
            };

            localStorage.setItem('orders', JSON.stringify(orders));

            cart = [];
            updateCartDisplay();

            document.getElementById('checkoutModal').style.display = 'none';
            document.getElementById('checkoutForm').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('checkoutOrderDate').value = today;

            showSuccessMessage('ஆர்டர் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!');

            // Redirect back to order details
            setTimeout(() => {
                window.location.href = 'orderdetails.html';
            }, 1000);
            return;
        }
    }

    // Create new order
    const newOrder = {
        id: Date.now(),
        customerName,
        phone1,
        phone2,
        orderDate,
        deliveryDate,
        paymentMode,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            count: item.count || 1
        })),
        totalAmount,
        advanceAmount,
        remainingAmount,
        isDelivered: false,
        createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    cart = [];
    updateCartDisplay();

    document.getElementById('checkoutModal').style.display = 'none';
    document.getElementById('checkoutForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkoutOrderDate').value = today;

    showSuccessMessage('ஆர்டர் வெற்றிகரமாக செய்யப்பட்டது!');
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => document.body.removeChild(successDiv), 3000);
}
