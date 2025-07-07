<?php
session_start();
require_once 'config/database.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Café Manager - Inventory & Sales System</title>
    <link rel="stylesheet" href="css/styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>

<body>
    <div class="app-container">
        <!-- Sidebar -->
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h1><span class="brand-blue">Café</span><span class="brand-green">Manager</span></h1>
                <p>Inventory & Sales System</p>
            </div>

            <nav class="sidebar-nav">
                <button class="nav-item active" onclick="showView('dashboard')" data-view="dashboard">
                    <i class="fas fa-chart-line"></i>
                    <span>Dashboard</span>
                </button>
                <button class="nav-item" onclick="showView('orders')" data-view="orders">
                    <i class="fas fa-shopping-cart"></i>
                    <span>Order Management</span>
                </button>
                <button class="nav-item" onclick="showView('inventory')" data-view="inventory">
                    <i class="fas fa-boxes"></i>
                    <span>Inventory</span>
                </button>
                <button class="nav-item" onclick="showView('order-logs')" data-view="order-logs">
                    <i class="fas fa-file-alt"></i>
                    <span>Order Logs</span>
                </button>
                <button class="nav-item" onclick="showView('sales-reports')" data-view="sales-reports">
                    <i class="fas fa-chart-bar"></i>
                    <span>Sales Reports</span>
                </button>
                <button class="nav-item" onclick="showView('best-selling')" data-view="best-selling">
                    <i class="fas fa-trophy"></i>
                    <span>Best Selling Items</span>
                </button>
                <button class="nav-item" onclick="showView('store-logging')" data-view="store-logging">
                    <i class="fas fa-clock"></i>
                    <span>Store Logging</span>
                </button>
            </nav>

            <div class="sidebar-footer">
                <button class="logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Dashboard View -->
            <div id="dashboard-view" class="view active">
                <div class="header"> <h1>Dashboard</h1> </div>
                <br>
                    <div class="dashboard-grid">
                        <div class="card gradient-green">
                            <h3>Today's Sales</h3>
                            <div class="card-value" id="todaySales">₱0.00</div>
                        </div>
                        <div class="card gradient-blue">
                            <h3>Today's Orders</h3>
                            <div class="card-value" id="todayOrders">0</div>
                        </div>
                        <div class="card gradient-purple">
                            <h3>Low Stock Items</h3>
                            <div class="card-value" id="lowStockCount">0</div>
                        </div>
                    </div>

                    <div class="dashboard-section">
                        <h2>Low Stock Alert</h2>
                        <div id="lowStockItems" class="low-stock-list">
                            <!-- Low stock items will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Order Management View -->
                <div id="orders-view" class="view">
                    <h1>Order Management</h1>
                    <div class="order-container">
                        <div class="menu-section">
                            <h2>Menu Items</h2>
                            <div id="menuItems" class="menu-grid">
                                <!-- Menu items will be loaded here -->
                            </div>
                        </div>

                        <div class="order-section">
                            <h2>Current Order</h2>
                            <div class="customer-info">
                                <input type="text" id="customerName" placeholder="Customer Name (Optional)">
                            </div>
                            <div id="orderItems" class="order-items">
                                <!-- Order items will appear here -->
                            </div>
                            <div class="order-total">
                                <div class="total-line">
                                    <span>Total: ₱<span id="orderTotal">0.00</span></span>
                                </div>
                            </div>
                            <div class="payment-section">
                                <input type="number" id="amountPaid" placeholder="Amount Paid" step="0.01">
                                <div class="change-display">
                                    Change: ₱<span id="changeAmount">0.00</span>
                                </div>
                                <button class="btn btn-primary" onclick="processOrder()">Process Order</button>
                                <button class="btn btn-secondary" onclick="clearOrder()">Clear Order</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Inventory View -->
                <div id="inventory-view" class="view">
                    <h1>Inventory Management</h1>
                    <div class="inventory-actions">
                        <button class="btn btn-primary" onclick="showAddItemModal()">Add New Item</button>
                    </div>
                    <div id="inventoryItems" class="inventory-grid">
                        <!-- Inventory items will be loaded here -->
                    </div>
                </div>

                <!-- Order Logs View -->
                <div id="order-logs-view" class="view">
                    <h1>Order Logs</h1>
                    <div class="logs-filter">
                        <input type="date" id="logDate" onchange="loadOrderLogs()">
                        <button class="btn btn-primary" onclick="loadOrderLogs()">Filter</button>
                    </div>
                    <div id="orderLogsList" class="logs-list">
                        <!-- Order logs will be loaded here -->
                    </div>
                </div>

                <!-- Sales Reports View -->
                <div id="sales-reports-view" class="view">
                    <h1>Sales Reports</h1>
                    <div class="reports-filter">
                        <input type="date" id="reportStartDate">
                        <input type="date" id="reportEndDate">
                        <button class="btn btn-primary" onclick="generateReport()">Generate Report</button>
                        <button class="btn btn-secondary" onclick="exportReport()">Export CSV</button>
                    </div>
                    <div id="salesReportData" class="report-data">
                        <!-- Sales report will be loaded here -->
                    </div>
                </div>

                <!-- Best Selling Items View -->
                <div id="best-selling-view" class="view">
                    <h1>Best Selling Items</h1>
                    <div id="bestSellingItems" class="best-selling-list">
                        <!-- Best selling items will be loaded here -->
                    </div>
                </div>

                <!-- Store Logging View -->
                <div id="store-logging-view" class="view">
                    <h1>Store Logging</h1>
                    <div class="store-actions">
                        <button class="btn btn-success" onclick="timeIn()">Time In</button>
                        <button class="btn btn-danger" onclick="timeOut()">Time Out</button>
                    </div>
                    <div id="storeLogsList" class="store-logs">
                        <!-- Store logs will be loaded here -->
                    </div>
                </div>
        </main>
    </div>

    <!-- Modals -->
    <div id="addItemModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('addItemModal')">&times;</span>
            <h2>Add New Menu Item</h2>
            <form id="addItemForm">
                <input type="text" id="itemName" placeholder="Item Name" required>
                <textarea id="itemDescription" placeholder="Description"></textarea>
                <input type="number" id="itemPrice" placeholder="Price" step="0.01" required>
                <input type="number" id="itemStock" placeholder="Stock Quantity" required>
                <select id="itemCategory">
                    <option value="">Select Category</option>
                </select>
                <button type="submit" class="btn btn-primary">Add Item</button>
            </form>
        </div>
    </div>

    <script src="js/app.js"></script>
</body>

</html>