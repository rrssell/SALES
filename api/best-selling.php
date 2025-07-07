
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
    $limit = $_GET['limit'] ?? 10;
    $days = $_GET['days'] ?? 30;

    $query = "SELECT 
                mi.name,
                mi.price,
                SUM(oi.quantity) as total_sold,
                SUM(oi.subtotal) as total_revenue,
                COUNT(DISTINCT oi.order_id) as order_count
              FROM order_items oi
              JOIN menu_items mi ON oi.menu_item_id = mi.id
              JOIN orders o ON oi.order_id = o.id
              WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) 
                AND o.status = 'completed'
              GROUP BY mi.id, mi.name, mi.price
              ORDER BY total_sold DESC
              LIMIT ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $days, $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    $bestSelling = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode($bestSelling);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
