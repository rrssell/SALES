// Global variables
let currentOrder = [];
let orderTotal = 0;
let menuItems = [];
let currentView = 'dashboard';
let isTimedIn = false; // Track if user has timed in

// Function to show the time-in modal
function showTimeInModal() {
    document.getElementById('timeInModal').style.display = 'block';
}

// Function to hide the time-in modal
function hideTimeInModal() {
    document.getElementById('timeInModal').style.display = 'none';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateOrderButtonState();
    loadDashboardData();
    loadMenuItems();
    loadCategories();
    setTodaysDate();
    document.getElementById('addItemModal').style.display = 'none';
    document.getElementById('timeInModal').style.display = 'none'; // Ensure modal is hidden on load
});

// Navigation functions
function showView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    currentView = viewName;
    
    // Check if trying to access orders without being timed in
    if (viewName === 'orders' && !isTimedIn) {
        showTimeInModal();
        document.getElementById('dashboard-view').classList.add('active'); // Fallback to dashboard
        document.querySelector(`[data-view="dashboard"]`).classList.add('active'); // Keep dashboard nav active
        currentView = 'dashboard';
        return;
    }
    
    // Show selected view
    document.getElementById(viewName + '-view').classList.add('active');
    
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
            hideTimeInModal(); // Ensure modal is hidden in store-logging
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
        
        let currentCategory = null;
        let currentSection = null;
        let currentGrid = null;

        menuItems.forEach(item => {
            const categoryName = item.category_name || 'Uncategorized';
            
            if (categoryName !== currentCategory) {
                currentCategory = categoryName;
                
                // Create category section
                currentSection = document.createElement('div');
                currentSection.className = 'category-section';
                
                // Add category heading
                const heading = document.createElement('h2');
                heading.textContent = currentCategory;
                currentSection.appendChild(heading);
                
                // Create grid for items
                currentGrid = document.createElement('div');
                currentGrid.className = 'menu-grid';
                currentSection.appendChild(currentGrid);
                
                container.appendChild(currentSection);
            }
            
            // Create item card
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.onclick = () => addToOrder(item);
            itemDiv.innerHTML = `
                <h3>${item.name}</h3>
                <div class="price">₱${parseFloat(item.price).toFixed(2)}</div>
                <div class="stock">Stock: ${item.stock_quantity}</div>
            `;
            currentGrid.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Error loading menu items:', error);
        document.getElementById('menuItems').innerHTML = '<p>Error loading menu items</p>';
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
        
        // Create horizontal container for categories
        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = 'categories-container';
        
        let currentCategory = null;
        let currentSection = null;
        let currentGrid = null;

        items.forEach(item => {
            const categoryName = item.category_name || 'Uncategorized';
            
            if (categoryName !== currentCategory) {
                currentCategory = categoryName;
                
                // Create category section
                currentSection = document.createElement('div');
                currentSection.className = 'category-section';
                
                // Add category heading
                const heading = document.createElement('h2');
                heading.textContent = currentCategory;
                currentSection.appendChild(heading);
                
                // Create grid for items
                currentGrid = document.createElement('div');
                currentGrid.className = 'inventory-grid';
                currentSection.appendChild(currentGrid);
                
                categoriesContainer.appendChild(currentSection);
            }
            
            // Create item card
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
            currentGrid.appendChild(itemDiv);
        });
        
        container.appendChild(categoriesContainer);
    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventoryItems').innerHTML = '<p>Error loading inventory</p>';
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
                    <strong>₱${parseFloat(log.total_amount).toFixed(2)}</strong>
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
            isTimedIn = true; // Update timed-in status
            hideTimeInModal(); // Hide modal after successful time-in
            if (currentView === 'orders') {
                showView('orders'); // Load orders view if user was trying to access it
            }
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
            isTimedIn = false; // Update timed-in status
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

// Sales reports and best selling items functions
async function loadSalesReports() {
    const startDate = document.getElementById('reportStartDate').value || new Date().toISOString().split('T')[0];
    const endDate = document.getElementById('reportEndDate').value || new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`api/sales-reports.php?start_date=${startDate}&end_date=${endDate}`);
        const data = await response.json();
        
        const container = document.getElementById('salesReportData');
        container.innerHTML = '';
        
        if (data.error) {
            container.innerHTML = '<p>Error loading sales data</p>';
            return;
        }
        
        // Display totals
        const totalsDiv = document.createElement('div');
        totalsDiv.className = 'report-summary';
        totalsDiv.innerHTML = `
            <h3>Sales Summary (${data.period.start_date} to ${data.period.end_date})</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <strong>Total Orders:</strong> ${data.totals.total_orders || 0}
                </div>
                <div class="summary-item">
                    <strong>Total Sales:</strong> ₱${parseFloat(data.totals.total_sales || 0).toFixed(2)}
                </div>
                <div class="summary-item">
                    <strong>Average Order:</strong> ₱${parseFloat(data.totals.average_order || 0).toFixed(2)}
                </div>
            </div>
        `;
        container.appendChild(totalsDiv);
        
        // Display daily sales
        if (data.dailySales && data.dailySales.length > 0) {
            const dailyDiv = document.createElement('div');
            dailyDiv.innerHTML = '<h3>Daily Breakdown</h3>';
            
            data.dailySales.forEach(day => {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'report-item';
                dayDiv.innerHTML = `
                    <div>
                        <strong>${new Date(day.date).toLocaleDateString()}</strong><br>
                        Orders: ${day.total_orders}
                    </div>
                    <div>
                        <strong>₱${parseFloat(day.total_sales).toFixed(2)}</strong><br>
                        Avg: ₱${parseFloat(day.average_order).toFixed(2)}
                    </div>
                `;
                dailyDiv.appendChild(dayDiv);
            });
            
            container.appendChild(dailyDiv);
        } else {
            const noDataDiv = document.createElement('div');
            noDataDiv.innerHTML = '<p>No sales data found for this period.</p>';
            container.appendChild(noDataDiv);
        }
    } catch (error) {
        console.error('Error loading sales reports:', error);
        document.getElementById('salesReportData').innerHTML = '<p>Error loading sales data</p>';
    }
}

async function loadBestSellingItems() {
    try {
        const response = await fetch('api/best-selling.php?limit=10&days=30');
        const items = await response.json();
        
        const container = document.getElementById('bestSellingItems');
        container.innerHTML = '';
        
        if (items.error) {
            container.innerHTML = '<p>Error loading best selling items</p>';
            return;
        }
        
        if (items.length === 0) {
            container.innerHTML = '<p>No sales data available for the last 30 days.</p>';
            return;
        }
        
        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = '<h3>Top 10 Best Selling Items (Last 30 Days)</h3>';
        container.appendChild(headerDiv);
        
        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'report-item';
            itemDiv.innerHTML = `
                <div>
                    <strong>#${index + 1} ${item.name}</strong><br>
                    <span>₱${parseFloat(item.price).toFixed(2)} each</span><br>
                    <small>${item.order_count} orders</small>
                </div>
                <div>
                    <strong>${item.total_sold} sold</strong><br>
                    <span>₱${parseFloat(item.total_revenue).toFixed(2)} revenue</span>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Error loading best selling items:', error);
        document.getElementById('bestSellingItems').innerHTML = '<p>Error loading best selling items</p>';
    }
}

function generateReport() {
    loadSalesReports();
}

function exportReport() {
    const startDate = document.getElementById('reportStartDate').value || new Date().toISOString().split('T')[0];
    const endDate = document.getElementById('reportEndDate').value || new Date().toISOString().split('T')[0];
    const url = `api/sales-reports.php?start_date=${startDate}&end_date=${endDate}&export=csv`;
    window.location.href = url;
}

async function editItem(itemId) {
    try {
        const response = await fetch('api/inventory.php');
        const items = await response.json();
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            alert('Item not found!');
            return;
        }

        // Set modal for editing
        document.getElementById('modalTitle').textContent = 'Edit Menu Item';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemStock').value = item.stock_quantity;
        document.getElementById('itemLowStockThreshold').value = item.low_stock_threshold || 10;
        document.getElementById('itemCategory').value = item.category_id || '';
        document.getElementById('addItemForm').querySelector('button[type="submit"]').textContent = 'Save Changes';
        
        // Show modal
        document.getElementById('addItemModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading item for edit:', error);
        alert('Error loading item data');
    }
}

function updateOrderButtonState() {
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const totalAmount = parseFloat(document.getElementById('orderTotal').textContent) || 0;
    const submitBtn = document.getElementById('processOrderBtn');
    submitBtn.disabled = amountPaid < totalAmount || amountPaid <= 0;
    calculateChange();
}

async function processOrder() {
    if (currentOrder.length === 0) {
        alert('No items in order!');
        return;
    }
    
    const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const customerName = document.getElementById('customerName').value || 'Guest';
    if (!amountPaid || amountPaid < orderTotal) {
        alert('Insufficient payment amount!');
        return;
    }
    
    const orderData = {
        customer_name: customerName,
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
            alert(`Order ${result.order_number} placed successfully!`);
            clearOrder();
            loadMenuItems();
            loadInventoryItems();
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

document.getElementById('amountPaid').removeEventListener('input', calculateChange);
document.getElementById('amountPaid').addEventListener('input', function() {
    calculateChange();
    updateOrderButtonState();
});

// Toggle sidebar visibility
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Initialize hamburger menu and sidebar state
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addItemModal').style.display = 'none';
    document.getElementById('timeInModal').style.display = 'none';
    updateOrderButtonState();
    loadDashboardData();
    loadMenuItems();
    loadCategories();
    setTodaysDate();
    
    // Hamburger menu toggle
    document.getElementById('hamburgerBtn').addEventListener('click', toggleSidebar);
    
    // Set initial sidebar state based on screen size
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    } else {
        document.getElementById('sidebar').classList.add('active');
    }
});

// Update sidebar state on window resize
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    } else {
        document.getElementById('sidebar').classList.add('active');
    }
});