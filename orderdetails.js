// Check if user is logged in
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

let currentTab = 'all';

// Initialize order details page
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    
    // Handle tabs
    document.querySelectorAll('.order-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.dataset.tab;
            updateSectionTitle();
            loadOrders();
        });
    });
    
    // Handle search
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterOrders(e.target.value);
    });
    
    // Handle filter
    document.getElementById('filterStatus').addEventListener('change', function(e) {
        filterOrders('', e.target.value);
    });
    
    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        window.location.href = 'index.html';
    });
});

// Update section title
function updateSectionTitle() {
    const titles = {
        'toDeliver': 'நிலுவையில் உள்ள ஆர்டர்கள்',
        'all': 'அனைத்து ஆர்டர்கள்',
        'delivered': 'வழங்கப்பட்ட ஆர்டர்கள்',
        'dues': 'பணம் நிலுவையில் உள்ள ஆர்டர்கள்'
    };
    document.getElementById('ordersSectionTitle').textContent = titles[currentTab] || 'ஆர்டர்கள்';
}

// Get orders from localStorage
function getOrders() {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
}

// Save orders to localStorage
function saveOrders(orders) {
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Mark order as delivered
function markAsDelivered(orderId) {
    if (confirm('இந்த ஆர்டரை வழங்கப்பட்டதாக குறிக்கவா?')) {
        const orders = getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.isDelivered = true;
            order.deliveredAt = new Date().toISOString();
            saveOrders(orders);
            loadOrders();
            showSuccessMessage('ஆர்டர் வழங்கப்பட்டதாக குறிக்கப்பட்டது!');
        }
    }
}

// Open receive payment modal
let receiveContext = { orderId: null };
function openReceivePayment(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const totalAmount = order.totalAmount || 0;
    const advanceAmount = order.advanceAmount || 0;
    const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : Math.max(0, totalAmount - advanceAmount);
    receiveContext.orderId = orderId;
    const remEl = document.getElementById('receiveRemaining');
    if (remEl) remEl.textContent = `₹${remainingAmount.toFixed(2)}`;
    const amt = document.getElementById('receiveAmount');
    if (amt) amt.value = '';
    const note = document.getElementById('receiveNote');
    if (note) note.value = '';
    const modal = document.getElementById('receivePaymentModal');
    if (modal) modal.style.display = 'block';
}

function closeReceivePayment() {
    const modal = document.getElementById('receivePaymentModal');
    if (modal) modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('closeReceivePaymentModal');
    if (closeBtn) closeBtn.addEventListener('click', closeReceivePayment);
    const cancelBtn = document.getElementById('receiveCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeReceivePayment);
    const saveBtn = document.getElementById('receiveSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('receiveAmount').value || '0');
        if (!amount || amount <= 0) { alert('செல்லுபடியாகும் தொகையை உள்ளிடவும்'); return; }
        const orders = getOrders();
        const order = orders.find(o => o.id === receiveContext.orderId);
        if (!order) return;
        const totalAmount = order.totalAmount || 0;
        const currentAdvance = order.advanceAmount || 0;
        const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : Math.max(0, totalAmount - currentAdvance);
        if (amount > remainingAmount) { alert('பெறும் தொகை மீதமுள்ள தொகையை விட அதிகம் இருக்க முடியாது'); return; }
        // Persist payment entry
        if (!order.payments) order.payments = [];
        order.payments.push({ amount, note: (document.getElementById('receiveNote').value || '').trim(), date: new Date().toISOString() });
        order.advanceAmount = currentAdvance + amount;
        order.remainingAmount = Math.max(0, totalAmount - order.advanceAmount);
        saveOrders(orders);
        closeReceivePayment();
        showSuccessMessage('பணம் வெற்றிகரமாக பதிவு செய்யப்பட்டது!');
        loadOrders();
    });
});

function markAmountReceived(orderId) {
    if (!confirm('முழுத் தொகை பெறப்பட்டதாக குறிக்கவா?')) return;
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const totalAmount = order.totalAmount || 0;
    const currentAdvance = order.advanceAmount || 0;
    const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : Math.max(0, totalAmount - currentAdvance);
    if (remainingAmount <= 0) { showSuccessMessage('இப்போதே முழுத் தொகை பெறப்பட்டுள்ளது.'); return; }
    if (!order.payments) order.payments = [];
    order.payments.push({ amount: remainingAmount, note: 'Full balance received', date: new Date().toISOString() });
    order.advanceAmount = currentAdvance + remainingAmount;
    order.remainingAmount = 0;
    order.isPaymentReceived = true;
    saveOrders(orders);
    showSuccessMessage('முழுத் தொகை பெறப்பட்டது என்று குறிக்கப்பட்டது!');
    loadOrders();
}
// Cancel order
function cancelOrder(orderId) {
    if (confirm('இந்த ஆர்டரை ரத்துசெய்ய விரும்புகிறீர்களா? இந்த செயலை திரும்பப் பெற முடியாது.')) {
        const orders = getOrders();
        const filteredOrders = orders.filter(order => order.id !== orderId);
        saveOrders(filteredOrders);
        loadOrders();
        showSuccessMessage('ஆர்டர் வெற்றிகரமாக ரத்துசெய்யப்பட்டது!');
    }
}

// Load and display orders
function loadOrders(searchTerm = '', filter = 'all') {
    let orders = getOrders();
    const ordersList = document.getElementById('ordersList');
    
    // Filter by tab
    if (currentTab === 'toDeliver') {
        orders = orders.filter(order => !order.isDelivered);
    } else if (currentTab === 'delivered') {
        orders = orders.filter(order => order.isDelivered);
    } else if (currentTab === 'dues') {
        orders = orders.filter(order => {
            const totalAmount = order.totalAmount || 0;
            const advanceAmount = order.advanceAmount || 0;
            const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : (totalAmount - advanceAmount);
            return order.isDelivered && remainingAmount > 0;
        });
    }
    
    // Apply date filter
    if (filter === 'thisWeek') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        orders = orders.filter(order => new Date(order.deliveryDate || order.orderDate) >= weekAgo);
    } else if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        orders = orders.filter(order => (order.deliveryDate || order.orderDate) === today);
    }
    
    // Apply search
    if (searchTerm) {
        orders = orders.filter(order => 
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.items && order.items.some(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )) ||
            (order.sweet && order.sweet.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.karam && order.karam.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">ஆர்டர்கள் எதுவும் கிடைக்கவில்லை.</div>
            </div>
        `;
        return;
    }
    
    // Group orders by delivery date
    const groupedOrders = {};
    orders.forEach(order => {
        const deliveryDate = order.deliveryDate || order.orderDate;
        if (!groupedOrders[deliveryDate]) {
            groupedOrders[deliveryDate] = [];
        }
        groupedOrders[deliveryDate].push(order);
    });
    
    // Sort dates
    const sortedDates = Object.keys(groupedOrders).sort((a, b) => new Date(a) - new Date(b));
    
    // Render grouped orders
    ordersList.innerHTML = sortedDates.map(date => {
        const dateOrders = groupedOrders[date];
        const orderCount = dateOrders.length;
        
        return `
            <div class="delivery-date-group">
                <div class="delivery-date-header">
                    <h3>${formatDate(date)}</h3>
                    <span class="order-count-badge">${orderCount} ${orderCount === 1 ? 'ஆர்டர்' : 'ஆர்டர்கள்'}</span>
                </div>
                <div class="orders-in-group">
                    ${dateOrders.map(order => {
                        const itemsList = order.items ? order.items.map(item => {
                            const count = item.count || 1;
                            const qtyText = item.quantity === 0.25 ? '1/4' : item.quantity === 0.5 ? '1/2' : item.quantity === 0.75 ? '3/4' : item.quantity;
                            return `${escapeHtml(item.name)} (${qtyText} கிலோ × ${count} @ ₹${item.price.toFixed(2)})`;
                        }).join('<br>') : 
                        `${order.sweet || 'N/A'}, ${order.karam || 'N/A'}`;
                        
                        const totalAmount = order.totalAmount || 0;
                        const advanceAmount = order.advanceAmount || 0;
                        const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : (totalAmount - advanceAmount);
                        
                        return `
                            <div class="order-card-detailed">
                                <div class="order-card-header-detailed">
                                    <div>
                                        <h4 class="customer-name">${escapeHtml(order.customerName)}</h4>
                                        <p class="order-id">ஆர்டர் #${order.id}</p>
                                    </div>
                                    <div class="order-header-right">
                                        <div class="order-amount-large">₹${totalAmount.toFixed(2)}</div>
                                        <div class="order-action-buttons">
                                            ${!order.isDelivered ? `
                                                <button class="mark-delivered-btn" onclick="markAsDelivered(${order.id})">
                                                    வழங்கப்பட்டதாக குறி
                                                </button>
                                            ` : ''}
                                            <button class="edit-order-btn" onclick="startEditOnBilling(${order.id})">
                                                ஆர்டரை திருத்த
                                            </button>
                                            <button class="cancel-order-btn" onclick="cancelOrder(${order.id})">
                                                ஆர்டரை ரத்துசெய்
                                            </button>
                                            ${(order.isDelivered && remainingAmount > 0) ? `
                                                <button class="action-btn" onclick="markAmountReceived(${order.id})">
                                                    முழுத் தொகை பெறப்பட்டது
                                                </button>
                                                <button class="action-btn" onclick="openReceivePayment(${order.id})">
                                                    வரவேண்டிய பணம்
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="order-items-detailed">
                                    <h5>பொருட்கள்:</h5>
                                    <div class="items-list">${itemsList}</div>
                                </div>
                                <div class="order-payment-info">
                                    <div class="payment-info-row">
                                        <span class="payment-label">மொத்த தொகை:</span>
                                        <span class="payment-value">₹${totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div class="payment-info-row">
                                        <span class="payment-label">முன்பணம் செலுத்தப்பட்டது:</span>
                                        <span class="payment-value advance-amount">₹${advanceAmount.toFixed(2)}</span>
                                    </div>
                                    <div class="payment-info-row payment-remaining-row">
                                        <span class="payment-label"><strong>மீதமுள்ள தொகை:</strong></span>
                                        <span class="payment-value remaining-amount"><strong>₹${remainingAmount.toFixed(2)}</strong></span>
                                    </div>
                                </div>
                                <div class="order-dates-detailed">
                                    <div class="date-item">
                                        <span class="date-label">ஆர்டர் தேதி:</span>
                                        <span class="date-value">${formatDate(order.orderDate)}</span>
                                    </div>
                                    <div class="date-item">
                                        <span class="date-label">விநியோக தேதி:</span>
                                        <span class="date-value">${formatDate(order.deliveryDate)}</span>
                                    </div>
                                    ${order.isDelivered && order.deliveredAt ? `
                                        <div class="date-item">
                                            <span class="date-label">வழங்கப்பட்ட தேதி:</span>
                                            <span class="date-value">${formatDate(order.deliveredAt)}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Filter orders
function filterOrders(searchTerm = '', filter = 'all') {
    const currentFilter = filter || document.getElementById('filterStatus').value;
    loadOrders(searchTerm, currentFilter);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
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
        z-index: 10000;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        document.body.removeChild(successDiv);
    }, 3000);
}

// PDF Generation Functions
function downloadAllOrdersPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let orders = getOrders();
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    // Filter for to deliver orders (pending) and today's delivered orders
    const today = new Date().toISOString().split('T')[0];
    const filteredOrders = orders.filter(order => {
        // Include pending orders (to deliver)
        if (!order.isDelivered) return true;
        // Include today's delivered orders
        if (order.isDelivered && order.deliveredAt && order.deliveredAt.split('T')[0] === today) return true;
        return false;
    });
    
    if (filteredOrders.length === 0) {
        alert('பதிவிறக்க எந்த ஆர்டர்களும் இல்லை!');
        return;
    }
    
    generateOrdersPDF(doc, filteredOrders, 'To Deliver & Today\'s Delivered Orders Report');
}

function downloadTodayDeliveredPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let orders = getOrders();
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    const today = new Date().toISOString().split('T')[0];
    
    const todayDelivered = orders.filter(order => 
        order.isDelivered && 
        order.deliveredAt && 
        order.deliveredAt.split('T')[0] === today
    );
    
    if (todayDelivered.length === 0) {
        alert('இன்றைக்கு வழங்கப்பட்ட ஆர்டர்கள் எதுவும் இல்லை!');
        return;
    }
    
    generateOrdersPDF(doc, todayDelivered, `Today's Delivered Orders Report - ${today}`);
}

function downloadByDatePDF() {
    const date = prompt('ஆர்டர்களை பதிவிறக்க தேதியை உள்ளிடவும் (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('தேதி வடிவம் தவறு. YYYY-MM-DD'); return; }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let orders = getOrders();
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    const dateOrders = orders.filter(order => {
        const orderDate = (order.orderDate || '').split('T')[0];
        const deliveryDate = order.deliveryDate ? order.deliveryDate.split('T')[0] : '';
        return orderDate === date || deliveryDate === date;
    });
    
    if (dateOrders.length === 0) {
        alert(`தேதிக்கு ஆர்டர்கள் எதுவும் கிடைக்கவில்லை: ${date}`);
        return;
    }
    
    generateOrdersPDF(doc, dateOrders, `Orders Report - ${date}`);
}

function generateOrdersPDF(doc, orders, title) {
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - (2 * margin);
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Pottu Pachaiyapan Catering & Sweets', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(title, margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);
    yPos += 10;
    
    // Summary
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.isDelivered).length;
    const pendingOrders = totalOrders - deliveredOrders;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const deliveredRevenue = orders.filter(o => o.isDelivered).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Orders: ${totalOrders}`, margin, yPos);
    yPos += 6;
    doc.text(`Delivered: ${deliveredOrders} | Pending: ${pendingOrders}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, margin, yPos);
    yPos += 6;
    doc.text(`Delivered Revenue: ₹${deliveredRevenue.toFixed(2)}`, margin, yPos);
    yPos += 10;
    
    // Group orders by date
    const groupedOrders = {};
    orders.forEach(order => {
        const date = order.deliveryDate || order.orderDate;
        const dateStr = date.split('T')[0];
        if (!groupedOrders[dateStr]) {
            groupedOrders[dateStr] = [];
        }
        groupedOrders[dateStr].push(order);
    });
    
    const sortedDates = Object.keys(groupedOrders).sort((a, b) => new Date(a) - new Date(b));
    
    // Order details
    sortedDates.forEach((date, dateIndex) => {
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }
        
        const dateOrders = groupedOrders[date];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(formatDateForPDF(date) + ` (${dateOrders.length} ${dateOrders.length === 1 ? 'Order' : 'Orders'})`, margin, yPos);
        yPos += 8;
        
        dateOrders.forEach((order, orderIndex) => {
            if (yPos > pageHeight - 70) {
                doc.addPage();
                yPos = 20;
            }
            
            // Customer info
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            const customerInfo = `Order #${order.id} - ${order.customerName}`;
            doc.text(customerInfo, margin, yPos);
            yPos += 6;
            
            // Items
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const count = item.count || 1;
                    const qtyText = item.quantity === 0.25 ? '1/4' : 
                                   item.quantity === 0.5 ? '1/2' : 
                                   item.quantity === 0.75 ? '3/4' : item.quantity;
                    const itemTotal = item.price * item.quantity * count;
                    const itemText = `  • ${item.name} - ${qtyText}KG × ${count} @ ₹${item.price.toFixed(2)} = ₹${itemTotal.toFixed(2)}`;
                    
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    doc.text(itemText, margin + 5, yPos);
                    yPos += 5;
                });
            } else {
                const itemsText = `  • ${order.sweet || 'N/A'}, ${order.karam || 'N/A'}`;
                doc.text(itemsText, margin + 5, yPos);
                yPos += 5;
            }
            
            // Order details
            doc.setFontSize(8);
            doc.text(`Order Date: ${formatDateForPDF(order.orderDate)}`, margin + 5, yPos);
            yPos += 4;
            doc.text(`Delivery Date: ${formatDateForPDF(order.deliveryDate)}`, margin + 5, yPos);
            yPos += 4;
            
            if (order.isDelivered && order.deliveredAt) {
                doc.text(`Delivered At: ${formatDateForPDF(order.deliveredAt)}`, margin + 5, yPos);
                yPos += 4;
            }
            
            const totalAmount = order.totalAmount || 0;
            const advanceAmount = order.advanceAmount || 0;
            const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : (totalAmount - advanceAmount);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, margin + 5, yPos);
            yPos += 4;
            
            doc.setFont('helvetica', 'normal');
            doc.text(`Advance Paid: ₹${advanceAmount.toFixed(2)}`, margin + 5, yPos);
            yPos += 4;
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Remaining Amount: ₹${remainingAmount.toFixed(2)}`, margin + 5, yPos);
            yPos += 4;
            
            doc.setFont('helvetica', 'normal');
            doc.text(`Status: ${order.isDelivered ? 'Delivered' : 'Pending'}`, margin + 5, yPos);
            yPos += 8;
            
            // Separator line
            if (orderIndex < dateOrders.length - 1 || dateIndex < sortedDates.length - 1) {
                doc.setLineWidth(0.1);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5;
            }
        });
        
        if (dateIndex < sortedDates.length - 1) {
            yPos += 3;
        }
    });
    
    // Customer purchase summary
    if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Customer Purchase Summary', margin, yPos);
    yPos += 10;
    
    const customerSummary = {};
    orders.forEach(order => {
        if (!customerSummary[order.customerName]) {
            customerSummary[order.customerName] = {
                totalOrders: 0,
                totalAmount: 0,
                deliveredOrders: 0,
                deliveredAmount: 0,
                pendingOrders: 0,
                pendingAmount: 0
            };
        }
        customerSummary[order.customerName].totalOrders++;
        customerSummary[order.customerName].totalAmount += order.totalAmount || 0;
        if (order.isDelivered) {
            customerSummary[order.customerName].deliveredOrders++;
            customerSummary[order.customerName].deliveredAmount += order.totalAmount || 0;
        } else {
            customerSummary[order.customerName].pendingOrders++;
            customerSummary[order.customerName].pendingAmount += order.totalAmount || 0;
        }
    });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    Object.keys(customerSummary).sort().forEach(customer => {
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
        }
        
        const summary = customerSummary[customer];
        doc.setFont('helvetica', 'bold');
        doc.text(`${customer}:`, margin, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'normal');
        const statusText = summary.deliveredOrders > 0 && summary.pendingOrders > 0 
            ? 'Status: Partially Delivered' 
            : summary.deliveredOrders > 0 
            ? 'Status: All Delivered' 
            : 'Status: Pending';
        
        doc.text(`  ${statusText}`, margin + 5, yPos);
        yPos += 5;
        
        doc.text(`  Total Orders: ${summary.totalOrders}`, margin + 5, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.text(`  Amount Received (Delivered): ₹${summary.deliveredAmount.toFixed(2)}`, margin + 5, yPos);
        yPos += 5;
        
        doc.text(`  Amount Pending: ₹${summary.pendingAmount.toFixed(2)}`, margin + 5, yPos);
        yPos += 8;
    });
    
    // Packing Summary
    if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Packing Summary', margin, yPos);
    yPos += 10;
    
    // Calculate product totals
    const productSummary = {};
    orders.forEach(order => {
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                const productName = item.name;
                const quantity = item.quantity || 1;
                const count = item.count || 1;
                const totalKg = quantity * count;
                
                if (!productSummary[productName]) {
                    productSummary[productName] = {
                        totalKg: 0,
                        packages: {
                            '0.25': 0,  // 1/4 kg packets
                            '0.5': 0,   // 1/2 kg packets
                            '0.75': 0,  // 3/4 kg packets
                            '1': 0      // 1 kg packets
                        }
                    };
                }
                
                productSummary[productName].totalKg += totalKg;
                
                // Count packets by size
                const qtyKey = quantity.toString();
                if (productSummary[productName].packages[qtyKey] !== undefined) {
                    productSummary[productName].packages[qtyKey] += count;
                }
            });
        }
    });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    Object.keys(productSummary).sort().forEach(productName => {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = 20;
        }
        
        const summary = productSummary[productName];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${productName}:`, margin, yPos);
        yPos += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`  Total: ${summary.totalKg.toFixed(2)} kg`, margin + 5, yPos);
        yPos += 6;
        
        // Production/Packing details - display one by one
        if (summary.packages['1'] > 0) {
            doc.text(`  1 kg: ${summary.packages['1']} nos`, margin + 5, yPos);
            yPos += 6;
        }
        if (summary.packages['0.75'] > 0) {
            doc.text(`  3/4 kg: ${summary.packages['0.75']} nos`, margin + 5, yPos);
            yPos += 6;
        }
        if (summary.packages['0.5'] > 0) {
            doc.text(`  1/2 kg: ${summary.packages['0.5']} nos`, margin + 5, yPos);
            yPos += 6;
        }
        if (summary.packages['0.25'] > 0) {
            doc.text(`  1/4 kg: ${summary.packages['0.25']} nos`, margin + 5, yPos);
            yPos += 6;
        }
        
        yPos += 3;
    });
    
    // Save PDF
    const fileName = title.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.pdf';
    doc.save(fileName);
}

// Helper function for PDF date formatting
function formatDateForPDF(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Add Edit Order state
let editOrderId = null;
let editOrderItems = [];

function getProducts() {
    const products = localStorage.getItem('products');
    return products ? JSON.parse(products) : [];
}

// Open Edit Modal
function openEditOrder(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order || order.isDelivered) return; // prevent editing delivered orders
    editOrderId = orderId;
    editOrderItems = (order.items || []).map(i => ({...i}));

    // Populate product select
    const productSelect = document.getElementById('editAddProduct');
    const products = getProducts();
    productSelect.innerHTML = products.map(p => `<option value="${p.id}" data-price="${p.price}">${escapeHtml(p.name)} - ₹${p.price.toFixed(2)}/கிலோ</option>`).join('');

    // Render items and totals
    renderEditItems(order);

    document.getElementById('editOrderModal').style.display = 'block';
}

function renderEditItems(orderContext) {
    const list = document.getElementById('editItemsList');
    if (!editOrderItems || editOrderItems.length === 0) {
        list.innerHTML = '<p class="empty-cart">ஆர்டரில் பொருட்கள் இல்லை</p>';
    } else {
        list.innerHTML = editOrderItems.map((item, idx) => {
            const count = item.count || 1;
            const qtyText = item.quantity === 0.25 ? '1/4' : item.quantity === 0.5 ? '1/2' : item.quantity === 0.75 ? '3/4' : item.quantity;
            const itemTotal = item.price * item.quantity * count;
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${escapeHtml(item.name)}</h4>
                        <p>₹${item.price.toFixed(2)} × ${qtyText} கிலோ × ${count} = ₹${itemTotal.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="changeEditCount(${idx}, -1)">-</button>
                        <span class="qty-value">${count}</span>
                        <button class="qty-btn" onclick="changeEditCount(${idx}, 1)">+</button>
                        <button class="remove-btn" onclick="removeEditItem(${idx})">நீக்கு</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    updateEditTotals(orderContext);
}

function changeEditCount(index, delta) {
    const item = editOrderItems[index];
    if (!item) return;
    const next = (item.count || 1) + delta;
    if (next <= 0) {
        editOrderItems.splice(index, 1);
    } else {
        item.count = next;
    }
    const orders = getOrders();
    const order = orders.find(o => o.id === editOrderId);
    renderEditItems(order);
}

function removeEditItem(index) {
    editOrderItems.splice(index, 1);
    const orders = getOrders();
    const order = orders.find(o => o.id === editOrderId);
    renderEditItems(order);
}

function addEditItem() {
    const productId = parseInt(document.getElementById('editAddProduct').value, 10);
    const qty = parseFloat(document.getElementById('editAddQty').value);
    const count = Math.max(1, parseInt(document.getElementById('editAddCount').value || '1', 10));
    const products = getProducts();
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const existing = editOrderItems.find(i => i.id === p.id && i.quantity === qty);
    if (existing) {
        existing.count = (existing.count || 1) + count;
    } else {
        editOrderItems.push({ id: p.id, name: p.name, price: p.price, quantity: qty, count });
    }
    const orders = getOrders();
    const order = orders.find(o => o.id === editOrderId);
    renderEditItems(order);
}

function updateEditTotals(orderContext) {
    let totalAmount = 0;
    editOrderItems.forEach(item => {
        const count = item.count || 1;
        totalAmount += item.price * item.quantity * count;
    });
    const advanceAmount = (orderContext && orderContext.advanceAmount) ? orderContext.advanceAmount : 0;
    const remainingAmount = Math.max(0, totalAmount - advanceAmount);

    document.getElementById('editTotalAmount').textContent = `₹${totalAmount.toFixed(2)}`;
    document.getElementById('editAdvanceAmount').textContent = `₹${advanceAmount.toFixed(2)}`;
    document.getElementById('editRemainingAmount').innerHTML = `<strong>₹${remainingAmount.toFixed(2)}</strong>`;
}

function saveEditChanges() {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === editOrderId);
    if (idx === -1) return;
    const order = orders[idx];
    if (order.isDelivered) return; // safety

    // Recalculate totals
    let totalAmount = 0;
    editOrderItems.forEach(item => {
        const count = item.count || 1;
        totalAmount += item.price * item.quantity * count;
    });
    const advanceAmount = order.advanceAmount || 0;
    const remainingAmount = Math.max(0, totalAmount - advanceAmount);

    orders[idx] = {
        ...order,
        items: editOrderItems,
        totalAmount,
        remainingAmount
    };

    saveOrders(orders);
    document.getElementById('editOrderModal').style.display = 'none';
    showSuccessMessage('ஆர்டர் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!');
    loadOrders();
}

// Wire up modal controls after DOM is ready
(function initEditModalBindings(){
    document.addEventListener('DOMContentLoaded', function() {
        const addBtn = document.getElementById('editAddBtn');
        if (addBtn) addBtn.addEventListener('click', addEditItem);
        const closeBtn = document.getElementById('closeEditModal');
        if (closeBtn) closeBtn.addEventListener('click', () => {
            document.getElementById('editOrderModal').style.display = 'none';
        });
        const cancelBtn = document.getElementById('editCancelBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            document.getElementById('editOrderModal').style.display = 'none';
        });
        const saveBtn = document.getElementById('editSaveBtn');
        if (saveBtn) saveBtn.addEventListener('click', saveEditChanges);
    });
})();

function startEditOnBilling(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.isDelivered) {
        alert('வழங்கப்பட்ட ஆர்டர்களை திருத்த முடியாது.');
        return;
    }
    // Store edit context
    localStorage.setItem('editingOrderId', String(orderId));
    // Navigate to ordering page with query flag
    window.location.href = `ordering.html?edit=${orderId}`;
}

// ================== CSV EXPORT (Daily / By Date) ==================
// Format date from YYYY-MM-DD to DD-MM-YYYY
function formatDateForCSV(dateStr) {
    if (!dateStr) return '';
    // Handle date string that might be in YYYY-MM-DD format or ISO format
    let date;
    if (dateStr.includes('T')) {
        // ISO format with time
        date = new Date(dateStr);
    } else {
        // Assume YYYY-MM-DD format
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // Create date in local timezone to avoid UTC conversion issues
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            date = new Date(dateStr);
        }
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Convert order ID to export-friendly format while preserving uniqueness
function formatOrderIdForExport(orderId) {
    if (orderId === null || orderId === undefined) return '';
    const idStr = String(orderId);
    // If the ID is purely numeric, prefix with a single quote to prevent Excel from
    // truncating digits or converting to scientific notation, while keeping it unique
    if (/^\d+$/.test(idStr)) {
        return `'${idStr}`;
    }
    return idStr;
}

function buildOrdersExportDataset(targetDateStr) {
    let orders = getOrders();
    orders = orders.filter(o => (o.totalAmount || 0) > 0);

    const dateOnly = d => (d || '').split('T')[0];
    const filtered = orders.filter(o => {
        const orderDateOnly = dateOnly(o.orderDate);
        const deliveryDateOnly = dateOnly(o.deliveryDate);
        return orderDateOnly === targetDateStr || deliveryDateOnly === targetDateStr;
    });

    let totalAmountSum = 0;
    let totalAdvanceSum = 0;
    let totalBalanceSum = 0;

    const ordersData = filtered.map(o => {
        const total = o.totalAmount || 0;
        const adv = o.advanceAmount || 0;
        const remaining = (o.remainingAmount !== undefined) ? o.remainingAmount : Math.max(0, total - adv);
        const delivered = !!o.isDelivered;
        const paidStatus = remaining <= 0 ? 'Paid' : 'Pending';
        const paymentMode = o.paymentMode || 'Cash';

        totalAmountSum += total;
        totalAdvanceSum += adv;
        totalBalanceSum += remaining;

        const itemsDisplay = (o.items && o.items.length > 0)
            ? o.items.map(item => {
                const count = item.count || 1;
                const qtyText = item.quantity === 0.25 ? '1/4kg' :
                               item.quantity === 0.5 ? '1/2kg' :
                               item.quantity === 0.75 ? '3/4kg' :
                               `${item.quantity}kg`;
                return `${item.name} (${qtyText} x ${count} @ ₹${item.price.toFixed(2)})`;
              }).join(' | ')
            : `${o.sweet || 'N/A'}, ${o.karam || 'N/A'}`;

        return {
            orderIdDisplay: formatOrderIdForExport(o.id),
            orderIdPdf: String(o.id ?? ''),
            orderIdRaw: o.id,
            customerName: o.customerName || '',
            mobileNumber: o.phone1 || '',
            orderDateDisplay: formatDateForCSV(o.orderDate),
            deliveryDateDisplay: formatDateForCSV(o.deliveryDate),
            deliveryStatus: delivered ? 'Yes' : 'No',
            orderAmount: total.toFixed(2),
            advanceAmount: adv.toFixed(2),
            balanceAmount: remaining.toFixed(2),
            paymentStatus: paidStatus,
            paymentMode,
            itemsDisplay
        };
    });

    return {
        targetDate: targetDateStr,
        targetDateDisplay: formatDateForCSV(targetDateStr),
        orders: ordersData,
        totals: {
            totalAmount: totalAmountSum.toFixed(2),
            totalAdvance: totalAdvanceSum.toFixed(2),
            totalBalance: totalBalanceSum.toFixed(2)
        }
    };
}

function buildOrdersCSVRowsFromDataset(dataset) {
    const rows = [];
    const headers = [
        'Order ID','Customer Name','Mobile Number','Order Booking Date','Delivery Date',
        'Delivery status','Order Amount','Advance Amount','Balance Amount',
        'Payment Status','Payment Mode','Items'
    ];
    rows.push(headers.join(','));

    const safe = v => {
        const str = String(v ?? '');
        if (str === '' || str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('|')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    dataset.orders.forEach(entry => {
        rows.push([
            entry.orderIdDisplay,
            entry.customerName,
            entry.mobileNumber,
            entry.orderDateDisplay,
            entry.deliveryDateDisplay,
            entry.deliveryStatus,
            entry.orderAmount,
            entry.advanceAmount,
            entry.balanceAmount,
            entry.paymentStatus,
            entry.paymentMode,
            safe(entry.itemsDisplay)
        ].join(','));
    });

    rows.push([
        'Totals',
        '',
        '',
        '',
        dataset.targetDateDisplay,
        '',
        dataset.totals.totalAmount,
        '',
        dataset.totals.totalBalance,
        '',
        '0',
        ''
    ].join(','));

    return rows;
}

function buildOrdersCSVRows(targetDateStr) {
    const dataset = buildOrdersExportDataset(targetDateStr);
    return {
        dataset,
        rows: buildOrdersCSVRowsFromDataset(dataset)
    };
}

function downloadOrdersCSVForDate(dateStr) {
    const { dataset, rows } = buildOrdersCSVRows(dateStr);
    if (dataset.orders.length === 0) { 
        alert(`இந்த விநியோக தேதிக்கு ஆர்டர்கள் இல்லை: ${dateStr}`); 
        return; 
    }
    // Prepend BOM and use CRLF for better Excel compatibility
    const csv = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Format filename like Orders_2025-11-08.csv
    a.download = `Orders_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadTodayOrdersCSV() {
    const today = new Date().toISOString().split('T')[0];
    downloadOrdersCSVForDate(today);
}

// Download CSV for today's delivery date
function downloadTodayDeliveryDateCSV() {
    const today = new Date().toISOString().split('T')[0];
    downloadOrdersCSVForDate(today);
}

function downloadOrdersCSVByDate() {
    const date = prompt('CSV க்காக விநியோக தேதியை உள்ளிடவும் (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('தேதி வடிவம் தவறு. YYYY-MM-DD'); return; }
    downloadOrdersCSVForDate(date);
}

function downloadOrdersTablePDFForDate(dateStr) {
    const dataset = buildOrdersExportDataset(dateStr);
    if (dataset.orders.length === 0) {
        alert(`இந்த தேதிக்கு ஆர்டர்கள் இல்லை: ${dateStr}`);
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    const generatedAt = new Date().toLocaleString();

    const columns = [
        { key: 'orderIdPdf', label: 'Order ID', width: 70 },
        { key: 'customerName', label: 'Customer Name', width: 90 },
        { key: 'mobileNumber', label: 'Mobile', width: 80 },
        { key: 'orderDateDisplay', label: 'Order Date', width: 80 },
        { key: 'deliveryDateDisplay', label: 'Delivery Date', width: 90 },
        { key: 'deliveryStatus', label: 'Delivered', width: 70 },
        { key: 'orderAmount', label: 'Order Amount', width: 80 },
        { key: 'advanceAmount', label: 'Advance', width: 70 },
        { key: 'balanceAmount', label: 'Balance', width: 70 },
        { key: 'paymentStatus', label: 'Payment Status', width: 80 },
        { key: 'paymentMode', label: 'Mode', width: 60 },
        { key: 'itemsDisplay', label: 'Items', width: 150 }
    ];

    const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const columnPositions = [];
    let currentX = margin;
    columns.forEach(col => {
        columnPositions.push(currentX);
        currentX += col.width;
    });

    function drawPageHeader() {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Pottu Pachaiyapan Catering & Sweets', margin, margin + 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Orders Report (Booking / Delivery Date: ${dataset.targetDateDisplay})`, margin, margin + 30);
        doc.setFontSize(10);
        doc.text(`Generated on: ${generatedAt}`, margin, margin + 46);
        doc.setLineWidth(0.5);
    }

    function drawTableHeader(startY) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        columns.forEach((col, idx) => {
            doc.text(col.label, columnPositions[idx], startY);
        });
        doc.line(margin, startY + 4, margin + totalTableWidth, startY + 4);
    }

    drawPageHeader();
    let cursorY = margin + 70;
    drawTableHeader(cursorY);
    cursorY += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    dataset.orders.forEach(entry => {
        const itemsIndex = columns.length - 1;
        const itemsWidth = columns[itemsIndex].width - 10;
        const itemLines = doc.splitTextToSize(entry.itemsDisplay, itemsWidth);
        const rowHeight = Math.max(18, itemLines.length * 12);

        columns.forEach((col, idx) => {
            const value = entry[col.key] || '';
            if (col.key === 'itemsDisplay') {
                itemLines.forEach((line, lineIdx) => {
                    doc.text(line, columnPositions[idx], cursorY + lineIdx * 12);
                });
            } else {
                doc.text(String(value), columnPositions[idx], cursorY);
            }
        });

        cursorY += rowHeight;

        if (cursorY > pageHeight - margin - 60) {
            doc.addPage();
            drawPageHeader();
            cursorY = margin + 70;
            drawTableHeader(cursorY);
            cursorY += 18;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
        }
    });

    if (cursorY > pageHeight - margin - 60) {
        doc.addPage();
        drawPageHeader();
        cursorY = margin + 70;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.line(margin, cursorY - 6, margin + totalTableWidth, cursorY - 6);
    doc.text('Totals', columnPositions[0], cursorY);
    doc.text(dataset.totals.totalAmount, columnPositions[6], cursorY);
    doc.text(dataset.totals.totalAdvance, columnPositions[7], cursorY);
    doc.text(dataset.totals.totalBalance, columnPositions[8], cursorY);

    doc.save(`Orders_${dateStr}.pdf`);
}

function downloadTodayOrdersTablePDF() {
    const today = new Date().toISOString().split('T')[0];
    downloadOrdersTablePDFForDate(today);
}

function downloadOrdersTablePDFByDate() {
    const date = prompt('PDF க்காக விநியோக/புக்கிங் தேதியை உள்ளிடவும் (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('தேதி வடிவம் தவறு. YYYY-MM-DD'); return; }
    downloadOrdersTablePDFForDate(date);
}
