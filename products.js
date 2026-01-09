// Check if user is logged in
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

// Export products as JSON file
function exportProductsJSON() {
    try {
        const data = JSON.stringify(getProducts(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccessMessage('Products JSON கோப்பு ஏற்றுமதி செய்யப்பட்டது');
    } catch (e) {
        alert('Products JSON ஏற்றுமதி செய்யும்போது பிழை ஏற்பட்டது.');
        console.error(e);
    }
}

// Export products as CSV file
function exportProductsCSV() {
    try {
        const products = getProducts();
        const headers = ['id','type','name','price'];
        const rows = [headers.join(',')];
        const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
        products.forEach(p => {
            rows.push([p.id, p.type, esc(p.name), (p.price ?? 0)].join(','));
        });
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_backup_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccessMessage('Products CSV கோப்பு ஏற்றுமதி செய்யப்பட்டது');
    } catch (e) {
        alert('Products CSV ஏற்றுமதி செய்யும்போது பிழை ஏற்பட்டது.');
        console.error(e);
    }
}

// Handle import products from JSON
function handleImportProductsJSON(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result || '[]');
            if (!Array.isArray(data)) throw new Error('Invalid JSON format');
            // basic validation
            const cleaned = data.map(p => ({
                id: p.id || Date.now() + Math.floor(Math.random()*1000),
                type: (p.type === 'sweet' || p.type === 'karam') ? p.type : 'sweet',
                name: String(p.name || '').trim(),
                price: Number(p.price || 0)
            })).filter(p => p.name);
            saveProducts(cleaned);
            loadProducts();
            showSuccessMessage('Products JSON வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது');
        } catch (err) {
            alert('செல்லுபடியாகாத JSON கோப்பு.');
            console.error(err);
        } finally {
            e.target.value = '';
        }
    };
    reader.onerror = function() {
        alert('கோப்பை படிக்கும்போது பிழை ஏற்பட்டது.');
    };
    reader.readAsText(file);
}

// Initialize products page
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    // Handle product form submission
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
    });
    
    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        window.location.href = 'index.html';
    });

    // Backup & Restore buttons
    const expJsonBtn = document.getElementById('exportProductsJSONBtn');
    if (expJsonBtn) expJsonBtn.addEventListener('click', exportProductsJSON);
    const expCsvBtn = document.getElementById('exportProductsCSVBtn');
    if (expCsvBtn) expCsvBtn.addEventListener('click', exportProductsCSV);
    const impJsonBtn = document.getElementById('importProductsJSONBtn');
    const impInput = document.getElementById('importProductsInput');
    if (impJsonBtn && impInput) {
        impJsonBtn.addEventListener('click', () => impInput.click());
        impInput.addEventListener('change', handleImportProductsJSON);
    }
});

// Get products from localStorage
function getProducts() {
    const products = localStorage.getItem('products');
    return products ? JSON.parse(products) : [];
}

// Save products to localStorage
function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

// Add new product
function addProduct() {
    const productType = document.getElementById('productType').value;
    const productName = document.getElementById('productName').value;
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    
    if (!productType || !productName || !productPrice) {
        alert('அனைத்து புலங்களையும் நிரப்பவும்');
        return;
    }
    
    const products = getProducts();
    const newProduct = {
        id: Date.now(),
        type: productType,
        name: productName,
        price: productPrice
    };
    
    products.push(newProduct);
    saveProducts(products);
    
    // Reset form
    document.getElementById('productForm').reset();
    
    // Reload products display
    loadProducts();
    
    showSuccessMessage('பொருள் வெற்றிகரமாக சேர்க்கப்பட்டது!');
}

// Delete product
function deleteProduct(id) {
    if (confirm('இந்த பொருளை நிச்சயமாக நீக்க விரும்புகிறீர்களா?')) {
        const products = getProducts();
        const filteredProducts = products.filter(product => product.id !== id);
        saveProducts(filteredProducts);
        loadProducts();
        showSuccessMessage('பொருள் வெற்றிகரமாக நீக்கப்பட்டது!');
    }
}

// Load and display products
function loadProducts() {
    const products = getProducts();
    const sweetsList = document.getElementById('sweetsList');
    const karamList = document.getElementById('karamList');
    
    const sweets = products.filter(p => p.type === 'sweet');
    const karam = products.filter(p => p.type === 'karam');
    
    sweetsList.innerHTML = sweets.length === 0 
        ? '<p class="empty-products">இன்னும் இனிப்பு சேர்க்கப்படவில்லை. உங்கள் முதல் இனிப்பைச் சேர்க்கவும்!</p>'
        : sweets.map(product => `
            <div class="product-card">
                <div class="product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-price">₹${product.price.toFixed(2)} / 1 கிலோ</p>
                </div>
                <button class="delete-product-btn" onclick="deleteProduct(${product.id})">நீக்கு</button>
            </div>
        `).join('');
    
    karamList.innerHTML = karam.length === 0
        ? '<p class="empty-products">இன்னும் காரம் சேர்க்கப்படவில்லை. உங்கள் முதல் காரத்தைச் சேர்க்கவும்!</p>'
        : karam.map(product => `
            <div class="product-card">
                <div class="product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p class="product-price">₹${product.price.toFixed(2)} / 1 கிலோ</p>
                </div>
                <button class="delete-product-btn" onclick="deleteProduct(${product.id})">நீக்கு</button>
            </div>
        `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Show success message
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
        z-index: 1000;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        document.body.removeChild(successDiv);
    }, 3000);
}
