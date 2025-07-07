
<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

require_once '../config/database.php';

try {
    // Get today's sales
    $today = date('Y-m-d');
    $query = "SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(*) as total_orders 
              FROM orders 
              WHERE DATE(created_at) = ? AND status = 'completed'";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $today);
    $stmt->execute();
    $result = $stmt->get_result();
    $todayStats = $result->fetch_assoc();

    // Get low stock count
    $query = "SELECT COUNT(*) as low_stock_count 
              FROM menu_items 
              WHERE stock_quantity <= low_stock_threshold AND is_available = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    $lowStockResult = $result->fetch_assoc();

    echo json_encode([
        'todaySales' => (float)$todayStats['total_sales'],
        'todayOrders' => (int)$todayStats['total_orders'],
        'lowStockCount' => (int)$lowStockResult['low_stock_count']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
