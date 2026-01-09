// Check if user is logged in
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = 'index.html';
}

let filterType = 'both';
let productSummaryByDate = {};

// Get orders from localStorage
function getOrders() {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
}

// Initialize packing summary page
document.addEventListener('DOMContentLoaded', function() {
    loadPackingSummary();
    
    document.getElementById('filterType').addEventListener('change', function(e) {
        filterType = e.target.value;
        loadPackingSummary();
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        window.location.href = 'index.html';
    });
    
    // Listen for storage changes (when orders are updated from other tabs/pages)
    window.addEventListener('storage', function(e) {
        if (e.key === 'orders') {
            loadPackingSummary();
            showSuccessMessage('ஆர்டர்கள் புதுப்பிக்கப்பட்டன. பேக்கிங் சுருக்கம் புதுப்பிக்கப்பட்டது!');
        }
    });
    
    // Also check for changes within the same page (when orders are updated)
    // This handles cases where orders are updated in the same window
    let lastOrdersHash = '';
    let isPageVisible = true;
    
    // Pause checking when page is hidden
    document.addEventListener('visibilitychange', function() {
        isPageVisible = !document.hidden;
    });
    
    function checkForOrderChanges() {
        if (!isPageVisible) return; // Don't check when page is hidden
        
        const orders = getOrders();
        const currentHash = JSON.stringify(orders.map(o => ({ id: o.id, isDelivered: o.isDelivered })));
        if (lastOrdersHash && lastOrdersHash !== currentHash) {
            loadPackingSummary();
            // Show a subtle notification
            const notification = document.createElement('div');
            notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
            notification.textContent = 'பேக்கிங் சுருக்கம் புதுப்பிக்கப்பட்டது';
            document.body.appendChild(notification);
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 2000);
        }
        lastOrdersHash = currentHash;
    }
    
    // Check for changes every 3 seconds (less frequent to reduce overhead)
    setInterval(checkForOrderChanges, 3000);
    
    // Also check when page gains focus (user returns to the tab)
    window.addEventListener('focus', function() {
        checkForOrderChanges();
    });
    
    // Set initial hash after a short delay
    setTimeout(() => {
        const orders = getOrders();
        lastOrdersHash = JSON.stringify(orders.map(o => ({ id: o.id, isDelivered: o.isDelivered })));
    }, 100);
});

function refreshPackingSummary() {
    loadPackingSummary();
    showSuccessMessage('பேக்கிங் சுருக்கம் புதுப்பிக்கப்பட்டது!');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function loadPackingSummary() {
    let orders = getOrders();
    
    // Filter out orders with zero amount
    orders = orders.filter(order => {
        const totalAmount = order.totalAmount || 0;
        return totalAmount > 0;
    });
    
    // Filter based on selected type
    const today = new Date().toISOString().split('T')[0];
    if (filterType === 'toDeliver') {
        // Only show orders that are NOT delivered (need to be packed)
        orders = orders.filter(order => !order.isDelivered);
    } else if (filterType === 'todayDelivered') {
        // Only show orders that were delivered today (for reference/completion tracking)
        orders = orders.filter(order => 
            order.isDelivered && 
            order.deliveredAt && 
            order.deliveredAt.split('T')[0] === today
        );
    } else if (filterType === 'both') {
        // Show orders that need to be delivered (not delivered) OR were delivered today
        orders = orders.filter(order => {
            // Include undelivered orders (need packing)
            if (!order.isDelivered) return true;
            // Include today's delivered orders (for reference)
            if (order.isDelivered && order.deliveredAt && order.deliveredAt.split('T')[0] === today) return true;
            return false;
        });
    }
    
    // Separate delivered and undelivered orders for better handling
    const undeliveredOrders = orders.filter(order => !order.isDelivered);
    const deliveredOrders = orders.filter(order => order.isDelivered);
    
    // Group orders by delivery date
    // For undelivered orders, group by delivery date (packing needed)
    // For delivered orders, group by delivery date (already packed and delivered)
    const ordersByDate = {};
    orders.forEach(order => {
        const deliveryDate = order.deliveryDate || order.orderDate;
        const dateStr = deliveryDate.split('T')[0];
        if (!ordersByDate[dateStr]) {
            ordersByDate[dateStr] = {
                undelivered: [],
                delivered: []
            };
        }
        if (order.isDelivered) {
            ordersByDate[dateStr].delivered.push(order);
        } else {
            ordersByDate[dateStr].undelivered.push(order);
        }
    });
    
    // Convert back to array format for compatibility, but mark delivery status
    const ordersByDateArray = {};
    Object.keys(ordersByDate).forEach(dateStr => {
        const dateGroup = ordersByDate[dateStr];
        // Combine orders but track which are delivered
        ordersByDateArray[dateStr] = [...dateGroup.undelivered, ...dateGroup.delivered];
    });
    
    // Sort dates
    const sortedDates = Object.keys(ordersByDateArray).sort((a, b) => new Date(a) - new Date(b));
    
    // Load saved checked state from localStorage
    const savedChecked = JSON.parse(localStorage.getItem('packingChecked') || '{}');
    const downloadedDates = JSON.parse(localStorage.getItem('packingDownloadedDates') || '{}');
    
    const packingList = document.getElementById('packingSummaryList');
    
    if (sortedDates.length === 0) {
        packingList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-text">பேக்கிங் செய்ய எந்த பொருட்களும் இல்லை.</div>
            </div>
        `;
        return;
    }
    
    // Generate HTML for each date group
    productSummaryByDate = {};
    packingList.innerHTML = sortedDates.map(deliveryDate => {
        const dateOrders = ordersByDateArray[deliveryDate];
        const dateGroup = ordersByDate[deliveryDate];
        const undeliveredCount = dateGroup.undelivered.length;
        const deliveredCount = dateGroup.delivered.length;
        
        // Calculate product totals for this date
        // Only count undelivered orders for packing (delivered orders are already packed)
        const productSummary = {};
        dateGroup.undelivered.forEach(order => {
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const productName = item.name;
                    const quantity = item.quantity || 1;
                    const count = item.count || 1;
                    const totalKg = quantity * count;
                    
                    const key = `${deliveryDate}_${productName}`;
                    
                    if (!productSummary[productName]) {
                        productSummary[productName] = {
                            totalKg: 0,
                            packages: {
                                '0.25': 0,  // 1/4 kg nos
                                '0.5': 0,   // 1/2 kg nos
                                '0.75': 0,  // 3/4 kg nos
                                '1': 0      // 1 kg nos
                            }
                        };
                    }
                    
                    productSummary[productName].totalKg += totalKg;
                    
                    // Count nos by size
                    const qtyKey = quantity.toString();
                    if (productSummary[productName].packages[qtyKey] !== undefined) {
                        productSummary[productName].packages[qtyKey] += count;
                    }
                });
            }
        });
        
        const orderCount = dateOrders.length;
        productSummaryByDate[deliveryDate] = productSummary;
        const isDownloaded = !!downloadedDates[deliveryDate];
        const safeDateId = deliveryDate.replace(/[^a-zA-Z0-9]/g, '_');
        
        // If filtering for "toDeliver" and all orders are delivered, skip this date group
        if (filterType === 'toDeliver' && undeliveredCount === 0) {
            return '';
        }
        
        // If no items to pack (all delivered), show a message
        const hasItemsToPack = Object.keys(productSummary).length > 0;
        
        // Show delivery status info
        let deliveryStatusBadge = '';
        if (deliveredCount > 0 && undeliveredCount > 0) {
            deliveryStatusBadge = `<span class="order-count-badge" style="background: #f59e0b; margin-left: 8px;">${deliveredCount} வழங்கப்பட்டது</span>`;
        } else if (deliveredCount > 0 && undeliveredCount === 0) {
            deliveryStatusBadge = `<span class="order-count-badge" style="background: #10b981; margin-left: 8px;">அனைத்தும் வழங்கப்பட்டது</span>`;
        }
        
        return `
            <div class="packing-date-group ${deliveredCount > 0 && undeliveredCount === 0 ? 'all-delivered' : ''}">
                <div class="packing-date-header">
                    <h3>${formatDate(deliveryDate)}</h3>
                    ${undeliveredCount > 0 ? `<span class="order-count-badge">${undeliveredCount} ${undeliveredCount === 1 ? 'ஆர்டர்' : 'ஆர்டர்கள்'} நிலுவையில்</span>` : ''}
                    ${deliveryStatusBadge}
                    <button class="download-btn" onclick="downloadPackingCSV('${deliveryDate}')">⬇️ பதிவிறக்கு</button>
                    <label class="download-tick" title="பதிவிறக்கம் முடிந்ததா?" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
                        <input type="checkbox" id="dl_${safeDateId}" ${isDownloaded ? 'checked' : ''} onchange="toggleDownloadedDate('${deliveryDate}', this.checked)">
                        <span>✅</span>
                    </label>
                </div>
                <div class="packing-items-in-group">
                    ${!hasItemsToPack && undeliveredCount === 0 ? `
                        <div class="empty-state" style="padding: 20px; text-align: center; color: #10b981;">
                            <p>✓ அனைத்து ஆர்டர்களும் வழங்கப்பட்டுள்ளன. பேக்கிங் தேவையில்லை.</p>
                        </div>
                    ` : !hasItemsToPack && undeliveredCount > 0 ? `
                        <div class="empty-state" style="padding: 20px; text-align: center; color: #f59e0b;">
                            <p>இந்த தேதிக்கு பொருட்கள் தரவு கிடைக்கவில்லை.</p>
                        </div>
                    ` : Object.keys(productSummary).sort().map(productName => {
                        const summary = productSummary[productName];
                        const key = `${deliveryDate}_${productName}`;
                        const isChecked = savedChecked[key] || false;
                        const safeId = key.replace(/[^a-zA-Z0-9]/g, '_');
                        
                        return `
                            <div class="packing-item-card ${isChecked ? 'checked' : ''}">
                                <div class="packing-item-header">
                                    <div class="packing-checkbox-container">
                                        <input type="checkbox" 
                                               id="pack_${safeId}" 
                                               class="packing-checkbox" 
                                               ${isChecked ? 'checked' : ''}
                                               onchange="togglePackingItem('${escapeHtml(key)}', this.checked)">
                                        <label for="pack_${safeId}" class="packing-product-name">
                                            <strong>${escapeHtml(productName)}</strong>
                                        </label>
                                    </div>
                                    <div class="packing-total-kg">
                                        மொத்தம்: <strong>${summary.totalKg.toFixed(2)} கிலோ</strong>
                                    </div>
                                </div>
                                <div class="packing-details">
                                    ${summary.packages['1'] > 0 ? `
                                        <div class="packing-detail-item">
                                            <span class="packing-size">1 kg:</span>
                                            <span class="packing-nos">${summary.packages['1']} nos</span>
                                        </div>
                                    ` : ''}
                                    ${summary.packages['0.75'] > 0 ? `
                                        <div class="packing-detail-item">
                                            <span class="packing-size">3/4 kg:</span>
                                            <span class="packing-nos">${summary.packages['0.75']} nos</span>
                                        </div>
                                    ` : ''}
                                    ${summary.packages['0.5'] > 0 ? `
                                        <div class="packing-detail-item">
                                            <span class="packing-size">1/2 kg:</span>
                                            <span class="packing-nos">${summary.packages['0.5']} nos</span>
                                        </div>
                                    ` : ''}
                                    ${summary.packages['0.25'] > 0 ? `
                                        <div class="packing-detail-item">
                                            <span class="packing-size">1/4 kg:</span>
                                            <span class="packing-nos">${summary.packages['0.25']} nos</span>
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

function togglePackingItem(key, isChecked) {
    const savedChecked = JSON.parse(localStorage.getItem('packingChecked') || '{}');
    savedChecked[key] = isChecked;
    localStorage.setItem('packingChecked', JSON.stringify(savedChecked));
    
    // Update visual state
    const safeId = key.replace(/[^a-zA-Z0-9]/g, '_');
    const checkbox = document.getElementById(`pack_${safeId}`);
    if (checkbox) {
        const card = checkbox.closest('.packing-item-card');
        if (card) {
            if (isChecked) {
                card.classList.add('checked');
            } else {
                card.classList.remove('checked');
            }
        }
    }
}

function toggleDownloadedDate(dateStr, isChecked) {
    const downloadedDates = JSON.parse(localStorage.getItem('packingDownloadedDates') || '{}');
    downloadedDates[dateStr] = isChecked;
    localStorage.setItem('packingDownloadedDates', JSON.stringify(downloadedDates));
}

function downloadPackingCSV(dateStr) {
    try {
        const summary = productSummaryByDate[dateStr] || {};
        const headers = ['Product', 'Total Kg', '1 kg nos', '3/4 kg nos', '1/2 kg nos', '1/4 kg nos'];
        const rows = [headers.join(',')];
        Object.keys(summary).sort().forEach(name => {
            const s = summary[name];
            const row = [
                '"' + name.replace(/"/g, '""') + '"',
                s.totalKg.toFixed(2),
                s.packages['1'] || 0,
                s.packages['0.75'] || 0,
                s.packages['0.5'] || 0,
                s.packages['0.25'] || 0
            ];
            rows.push(row.join(','));
        });
        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Packing_Summary_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Mark as downloaded (tick)
        toggleDownloadedDate(dateStr, true);
        const safeDateId = dateStr.replace(/[^a-zA-Z0-9]/g, '_');
        const cb = document.getElementById(`dl_${safeDateId}`);
        if (cb) cb.checked = true;

        showSuccessMessage('அந்த நாளின் பொருட்கள் CSV கோப்பாக பதிவிறக்கப்பட்டது');
    } catch (e) {
        alert('பதிவிறக்கும்போது பிழை ஏற்பட்டது.');
        console.error(e);
    }
}

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
        if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
        }
    }, 3000);
}

