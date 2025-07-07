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
    $input = json_decode(file_get_contents('php://input'), true);

    $query = "UPDATE menu_items SET name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ?, low_stock_threshold = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param(
        "ssdiisi",
        $input['name'],
        $input['description'],
        $input['price'],
        $input['stock_quantity'],
        $input['category_id'],
        $input['low_stock_threshold'],
        $input['id']
    );
    $stmt->execute();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
