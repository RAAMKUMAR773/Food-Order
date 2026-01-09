// Check if user is logged in
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    calculateStats();
    loadRecentOrders();
    displayHighestOrder();
    
    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        window.location.href = 'index.html';
    });
});

// Get orders from localStorage
function getOrders() {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
}

// Calculate and display statistics
function calculateStats() {
    let orders = getOrders();
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];
    
    // Filter orders from this week
    const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= weekAgo;
    });
    
    // Separate delivered and pending orders
    const deliveredOrders = orders.filter(order => order.isDelivered === true);
    const pendingOrders = orders.filter(order => !order.isDelivered);
    
    // Calculate delivered revenue (count only fully paid orders)
    let deliveredRevenue = 0;
    deliveredOrders.forEach(order => {
        const totalAmount = order.totalAmount || 0;
        const advanceAmount = order.advanceAmount || 0;
        const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : (totalAmount - advanceAmount);
        if (totalAmount && remainingAmount <= 0) {
            deliveredRevenue += totalAmount;
        }
    });
    
    // Calculate total advance received (all orders)
    const advanceReceived = orders.reduce((sum, order) => sum + (order.advanceAmount || 0), 0);
    
    // Calculate amount to deliver (remaining amounts from pending orders)
    let toDeliverAmount = 0;
    pendingOrders.forEach(order => {
        const totalAmount = order.totalAmount || 0;
        const advanceAmount = order.advanceAmount || 0;
        const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : (totalAmount - advanceAmount);
        toDeliverAmount += Math.max(0, remainingAmount);
    });
    
    // Get unique customers
    const uniqueCustomers = new Set(orders.map(order => order.customerName));
    
    // Find highest priced order
    let highestOrder = 0;
    if (orders.length > 0) {
        highestOrder = Math.max(...orders.map(order => order.totalAmount || 0));
    }
    
    // Today's orders
    const todayOrders = orders.filter(order => order.orderDate === today);
    
    // Today's revenue (only delivered and fully paid)
    let todayRevenue = 0;
    deliveredOrders.filter(order => order.orderDate === today).forEach(order => {
        const totalAmount = order.totalAmount || 0;
        const advanceAmount = order.advanceAmount || 0;
        const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : (totalAmount - advanceAmount);
        if (totalAmount && remainingAmount <= 0) {
            todayRevenue += totalAmount;
        }
    });
    
    // Calculate average order value
    const averageOrderValue = orders.length > 0 
        ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length 
        : 0;
    
    // Calculate completion rate
    const completionRate = orders.length > 0 
        ? ((deliveredOrders.length / orders.length) * 100).toFixed(1)
        : 0;
    
    // Update stats display
    document.getElementById('weeklyOrders').textContent = weeklyOrders.length;
    document.getElementById('deliveredRevenue').textContent = `₹${deliveredRevenue.toFixed(2)}`;
    document.getElementById('toDeliverAmount').textContent = `₹${toDeliverAmount.toFixed(2)}`;
    const advanceEl = document.getElementById('advanceReceived');
    if (advanceEl) advanceEl.textContent = `₹${advanceReceived.toFixed(2)}`;
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('deliveredOrders').textContent = deliveredOrders.length;
    document.getElementById('pendingOrders').textContent = pendingOrders.length;
    document.getElementById('totalCustomers').textContent = uniqueCustomers.size;
    document.getElementById('highestOrder').textContent = `₹${highestOrder.toFixed(2)}`;
    
    // Update analytics
    document.getElementById('averageOrderValue').textContent = `₹${averageOrderValue.toFixed(2)}`;
    document.getElementById('todayOrders').textContent = todayOrders.length;
    document.getElementById('todayRevenue').textContent = `₹${todayRevenue.toFixed(2)}`;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

// Load and display recent orders
function loadRecentOrders() {
    let orders = getOrders();
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    const recentOrdersList = document.getElementById('recentOrdersList');
    
    if (orders.length === 0) {
        recentOrdersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">No orders yet. Start taking orders!</div>
            </div>
        `;
        return;
    }
    
    // Sort by creation date (most recent first) and take last 5
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
        .slice(0, 5);
    
    recentOrdersList.innerHTML = recentOrders.map(order => {
        const itemsList = order.items ? order.items.map(item => {
            const count = item.count || 1;
            const qtyText = item.quantity === 0.25 ? '1/4' : item.quantity === 0.5 ? '1/2' : item.quantity === 0.75 ? '3/4' : item.quantity;
            return `${item.name} (${qtyText} கிலோ × ${count})`;
        }).join(', ') : `${order.sweet || 'N/A'}, ${order.karam || 'N/A'}`;
        
        const statusBadge = order.isDelivered 
            ? '<span class="status-badge delivered">வழங்கப்பட்டது</span>'
            : '<span class="status-badge pending">நிலுவையில்</span>';
        
        const totalAmount = order.totalAmount || 0;
        const advanceAmount = order.advanceAmount || 0;
        const remainingAmount = order.remainingAmount !== undefined ? order.remainingAmount : (totalAmount - advanceAmount);
        
        return `
            <div class="order-card">
                <div class="order-card-header">
                    <div class="customer-name">${escapeHtml(order.customerName)}</div>
                    <div>
                        ${statusBadge}
                        <span class="order-amount">₹${totalAmount.toFixed(2)}</span>
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-detail-item">
                        <span class="order-detail-label">பொருட்கள்</span>
                        <span class="order-detail-value">${escapeHtml(itemsList)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">மொத்த தொகை</span>
                        <span class="order-detail-value">₹${totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">முன்பணம் செலுத்தப்பட்டது</span>
                        <span class="order-detail-value">₹${advanceAmount.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label"><strong>மீதமுள்ள தொகை</strong></span>
                        <span class="order-detail-value"><strong>₹${remainingAmount.toFixed(2)}</strong></span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">ஆர்டர் தேதி</span>
                        <span class="order-detail-value">${formatDate(order.orderDate)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">விநியோக தேதி</span>
                        <span class="order-detail-value">${formatDate(order.deliveryDate)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

// Display highest order details
function displayHighestOrder() {
    let orders = getOrders();
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    const highestOrderDetails = document.getElementById('highestOrderDetails');
    
    if (orders.length === 0) {
        highestOrderDetails.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">இன்னும் ஆர்டர்கள் இல்லை. ஆர்டர்களை எடுக்க ஆரம்பிக்கவும்!</div>
            </div>
        `;
        return;
    }
    
    // Find highest priced order
    const highestOrderObj = orders.reduce((max, order) => {
        const orderAmount = order.totalAmount || 0;
        const maxAmount = max.totalAmount || 0;
        return orderAmount > maxAmount ? order : max;
    }, orders[0]);
    
    if (!highestOrderObj) {
        highestOrderDetails.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">ஆர்டர் தரவு கிடைக்கவில்லை.</div>
            </div>
        `;
        return;
    }
    
    // Format items list
    const itemsList = highestOrderObj.items ? highestOrderObj.items.map(item => {
        const count = item.count || 1;
        const qtyText = item.quantity === 0.25 ? '1/4' : item.quantity === 0.5 ? '1/2' : item.quantity === 0.75 ? '3/4' : item.quantity;
        const itemTotal = item.price * item.quantity * count;
        return `
            <div class="highest-order-item">
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-quantity">${qtyText} கிலோ × ${count}</span>
                <span class="item-price">₹${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('') : `
        <div class="highest-order-item">
            <span class="item-name">${escapeHtml(highestOrderObj.sweet || 'N/A')}, ${escapeHtml(highestOrderObj.karam || 'N/A')}</span>
        </div>
    `;
    
    const statusBadge = highestOrderObj.isDelivered 
        ? '<span class="status-badge delivered">வழங்கப்பட்டது</span>'
        : '<span class="status-badge pending">நிலுவையில்</span>';
    
    const totalAmount = highestOrderObj.totalAmount || 0;
    const advanceAmount = highestOrderObj.advanceAmount || 0;
    const remainingAmount = highestOrderObj.remainingAmount !== undefined ? highestOrderObj.remainingAmount : (totalAmount - advanceAmount);
    
    highestOrderDetails.innerHTML = `
        <div class="highest-order-header">
            <div class="highest-order-customer">
                <h3>${escapeHtml(highestOrderObj.customerName)}</h3>
                <p class="highest-order-id">ஆர்டர் #${highestOrderObj.id}</p>
            </div>
            <div class="highest-order-amount-section">
                <div class="highest-order-amount">₹${totalAmount.toFixed(2)}</div>
                ${statusBadge}
            </div>
        </div>
        <div class="highest-order-products">
            <h4>வாங்கப்பட்ட பொருட்கள்:</h4>
            <div class="highest-order-items-list">
                ${itemsList}
            </div>
        </div>
        <div class="highest-order-payment">
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
        <div class="highest-order-dates">
            <div class="date-item">
                <span class="date-label">ஆர்டர் தேதி:</span>
                <span class="date-value">${formatDate(highestOrderObj.orderDate)}</span>
            </div>
            <div class="date-item">
                <span class="date-label">விநியோக தேதி:</span>
                <span class="date-value">${formatDate(highestOrderObj.deliveryDate)}</span>
            </div>
            ${highestOrderObj.isDelivered && highestOrderObj.deliveredAt ? `
                <div class="date-item">
                    <span class="date-label">வழங்கப்பட்ட தேதி:</span>
                    <span class="date-value">${formatDate(highestOrderObj.deliveredAt)}</span>
                </div>
            ` : ''}
        </div>
    `;
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
