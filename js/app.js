
// Global variables
let currentOrder = [];
let orderTotal = 0;
let menuItems = [];
let currentView = 'dashboard';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadMenuItems();
    loadCategories();
    setTodaysDate();
});

// Navigation functions
function showView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    
    // Show selected view
    document.getElementById(viewName + '-view').classList.add('active');
    
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    currentView = viewName;
    
    // Load data for the view
    switch(viewName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'orders':
            loadMenuItems();
            break;
        case 'inventory':
            loadInventoryItems();
            break;
        case 'order-logs':
            loadOrderLogs();
            break;
        case 'sales-reports':
            loadSalesReports();
            break;
        case 'best-selling':
            loadBestSellingItems();
            break;
        case 'store-logging':
            loadStoreLogs();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const response = await fetch('api/dashboard.php');
        const data = await response.json();
        
        document.getElementById('todaySales').textContent = '₱' + data.todaySales.toFixed(2);
        document.getElementById('todayOrders').textContent = data.todayOrders;
        document.getElementById('lowStockCount').textContent = data.lowStockCount;
        
        // Load low stock items
        loadLowStockItems();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadLowStockItems() {
    try {
        const response = await fetch('api/low-stock.php');
        const items = await response.json();
        
        const container = document.getElementById('lowStockItems');
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<p>No low stock items</p>';
            return;
        }
        
        items.forEach(item => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'low-stock-alert';
            alertDiv.innerHTML = `
                <strong>${item.name}</strong> - Only ${item.stock_quantity} left
                <small>(Threshold: ${item.low_stock_threshold})</small>
            `;
            container.appendChild(alertDiv);
        });
    } catch (error) {
        console.error('Error loading low stock items:', error);
    }
}

// Menu and Order functions
async function loadMenuItems() {
    try {
        const response = await fetch('api/menu-items.php');
        menuItems = await response.json();
        
        const container = document.getElementById('menuItems');
        container.innerHTML = '';
        
        menuItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.onclick = () => addToOrder(item);
            itemDiv.innerHTML = `
                <h3>${item.name}</h3>
                <div class="price">₱${parseFloat(item.price).toFixed(2)}</div>
                <div class="stock">Stock: ${item.stock_quantity}</div>
            `;
            container.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Error loading menu items:', error);
    }
}

function addToOrder(item) {
    if (item.stock_quantity <= 0) {
        alert('Item is out of stock!');
        return;
    }
    
    const existingItem = currentOrder.find(orderItem => orderItem.id === item.id);
    
    if (existingItem) {
        if (existingItem.quantity < item.stock_quantity) {
            existingItem.quantity++;
            existingItem.subtotal = existingItem.quantity * parseFloat(item.price);
        } else {
            alert('Not enough stock available!');
            return;
        }
    } else {
        currentOrder.push({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: 1,
            subtotal: parseFloat(item.price)
        });
    }
    
    updateOrderDisplay();
}

function updateOrderDisplay() {
    const container = document.getElementById('orderItems');
    container.innerHTML = '';
    
    orderTotal = 0;
    
    currentOrder.forEach((item, index) => {
        orderTotal += item.subtotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';
        itemDiv.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                ₱${item.price.toFixed(2)} x ${item.quantity}
            </div>
            <div>
                ₱${item.subtotal.toFixed(2)}
                <button onclick="removeFromOrder(${index})" class="btn btn-danger" style="margin-left: 10px; padding: 4px 8px;">Remove</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });
    
    document.getElementById('orderTotal').textContent = orderTotal.toFixed(2);
    calculateChange();
}

function removeFromOrder(index) {
    currentOrder.splice(index, 1);
    updateOrderDisplay();
}

function calculateChange() {
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const change = amountPaid - orderTotal;
    document.getElementById('changeAmount').textContent = change >= 0 ? change.toFixed(2) : '0.00';
}

document.getElementById('amountPaid').addEventListener('input', calculateChange);

async function processOrder() {
    if (currentOrder.length === 0) {
        alert('No items in order!');
        return;
    }
    
    const amountPaid = parseFloat(document.getElementById('amountPaid').value);
    if (!amountPaid || amountPaid < orderTotal) {
        alert('Invalid payment amount!');
        return;
    }
    
    const orderData = {
        customer_name: document.getElementById('customerName').value,
        items: currentOrder,
        total_amount: orderTotal,
        amount_paid: amountPaid,
        change_amount: amountPaid - orderTotal
    };
    
    try {
        const response = await fetch('api/process-order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Order processed successfully!');
            clearOrder();
            loadMenuItems(); // Refresh stock quantities
            if (currentView === 'dashboard') {
                loadDashboardData();
            }
        } else {
            alert('Error processing order: ' + result.message);
        }
    } catch (error) {
        console.error('Error processing order:', error);
        alert('Error processing order!');
    }
}

function clearOrder() {
    currentOrder = [];
    orderTotal = 0;
    document.getElementById('customerName').value = '';
    document.getElementById('amountPaid').value = '';
    updateOrderDisplay();
}

// Inventory functions
async function loadInventoryItems() {
    try {
        const response = await fetch('api/inventory.php');
        const items = await response.json();
        
        const container = document.getElementById('inventoryItems');
        container.innerHTML = '';
        
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description || 'No description'}</p>
                <div class="item-info">
                    <span>Price: ₱${parseFloat(item.price).toFixed(2)}</span>
                    <span>Stock: ${item.stock_quantity}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary" onclick="restockItem(${item.id})">Restock</button>
                    <button class="btn btn-secondary" onclick="editItem(${item.id})">Edit</button>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

async function restockItem(itemId) {
    const quantity = prompt('Enter quantity to add:');
    if (!quantity || quantity <= 0) return;
    
    try {
        const response = await fetch('api/restock.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_id: itemId,
                quantity: parseInt(quantity)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Item restocked successfully!');
            loadInventoryItems();
        } else {
            alert('Error restocking item!');
        }
    } catch (error) {
        console.error('Error restocking item:', error);
    }
}

// Modal functions
function showAddItemModal() {
    document.getElementById('addItemModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function loadCategories() {
    try {
        const response = await fetch('api/categories.php');
        const categories = await response.json();
        
        const select = document.getElementById('itemCategory');
        select.innerHTML = '<option value="">Select Category</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

document.getElementById('addItemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('itemName').value,
        description: document.getElementById('itemDescription').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        stock_quantity: parseInt(document.getElementById('itemStock').value),
        category_id: document.getElementById('itemCategory').value || null
    };
    
    try {
        const response = await fetch('api/add-item.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Item added successfully!');
            closeModal('addItemModal');
            document.getElementById('addItemForm').reset();
            loadInventoryItems();
            loadMenuItems();
        } else {
            alert('Error adding item!');
        }
    } catch (error) {
        console.error('Error adding item:', error);
    }
});

// Order logs functions
async function loadOrderLogs() {
    const date = document.getElementById('logDate').value || new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`api/order-logs.php?date=${date}`);
        const logs = await response.json();
        
        const container = document.getElementById('orderLogsList');
        container.innerHTML = '';
        
        if (logs.length === 0) {
            container.innerHTML = '<p>No orders found for this date.</p>';
            return;
        }
        
        logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = 'log-item';
            logDiv.innerHTML = `
                <div>
                    <strong>Order #${log.order_number}</strong><br>
                    Customer: ${log.customer_name || 'Walk-in'}<br>
                    Time: ${new Date(log.created_at).toLocaleTimeString()}
                </div>
                <div>
                    <strong>$${parseFloat(log.total_amount).toFixed(2)}</strong>
                </div>
            `;
            container.appendChild(logDiv);
        });
    } catch (error) {
        console.error('Error loading order logs:', error);
    }
}

// Store logging functions
async function timeIn() {
    try {
        const response = await fetch('api/time-log.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'time_in'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Time in recorded!');
            loadStoreLogs();
        } else {
            alert('Error recording time in!');
        }
    } catch (error) {
        console.error('Error with time in:', error);
    }
}

async function timeOut() {
    try {
        const response = await fetch('api/time-log.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'time_out'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Time out recorded!');
            loadStoreLogs();
        } else {
            alert('Error recording time out!');
        }
    } catch (error) {
        console.error('Error with time out:', error);
    }
}

async function loadStoreLogs() {
    try {
        const response = await fetch('api/store-logs.php');
        const logs = await response.json();
        
        const container = document.getElementById('storeLogsList');
        container.innerHTML = '';
        
        logs.forEach(log => {
            const logDiv = document.createElement('div');
            logDiv.className = 'log-item';
            logDiv.innerHTML = `
                <div>
                    <strong>${log.action.replace('_', ' ').toUpperCase()}</strong><br>
                    ${new Date(log.timestamp).toLocaleString()}
                </div>
                <div>
                    ${log.username}
                </div>
            `;
            container.appendChild(logDiv);
        });
    } catch (error) {
        console.error('Error loading store logs:', error);
    }
}

// Utility functions
function setTodaysDate() {
    const today = new Date().toISOString().split('T')[0];
    const logDate = document.getElementById('logDate');
    const reportStartDate = document.getElementById('reportStartDate');
    const reportEndDate = document.getElementById('reportEndDate');
    
    if (logDate) logDate.value = today;
    if (reportStartDate) reportStartDate.value = today;
    if (reportEndDate) reportEndDate.value = today;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'logout.php';
    }
}

// Sales reports and best selling items functions would be similar
// Adding placeholders for completeness
async function loadSalesReports() {
    console.log('Loading sales reports...');
}

async function loadBestSellingItems() {
    console.log('Loading best selling items...');
}

function generateReport() {
    console.log('Generating report...');
}

function exportReport() {
    console.log('Exporting report...');
}
