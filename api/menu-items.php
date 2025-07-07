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
    $query = "SELECT m.id, m.name, m.description, m.price, m.stock_quantity, c.name as category_name 
              FROM menu_items m 
              LEFT JOIN categories c ON m.category_id = c.id 
              WHERE m.is_available = 1 
              ORDER BY c.name, m.name";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    $items = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode($items);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
