
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

    if (!$input || !isset($input['items']) || empty($input['items'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid order data']);
        exit();
    }

    $conn->autocommit(FALSE);

    // Generate order number
    $orderNumber = 'ORD-' . date('Ymd') . '-' . sprintf('%04d', rand(1, 9999));

    // Insert order
    $query = "INSERT INTO orders (order_number, customer_name, total_amount, amount_paid, change_amount, cashier_id) 
              VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param(
        "ssdddi",
        $orderNumber,
        $input['customer_name'],
        $input['total_amount'],
        $input['amount_paid'],
        $input['change_amount'],
        $_SESSION['user_id']
    );
    $stmt->execute();

    $orderId = $conn->insert_id;

    // Insert order items and update stock
    foreach ($input['items'] as $item) {
        // Insert order item
        $query = "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal) 
                  VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param(
            "iiidd",
            $orderId,
            $item['id'],
            $item['quantity'],
            $item['price'],
            $item['subtotal']
        );
        $stmt->execute();

        // Update stock
        $query = "UPDATE menu_items SET stock_quantity = stock_quantity - ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $item['quantity'], $item['id']);
        $stmt->execute();

        // Record stock movement
        $query = "SELECT stock_quantity FROM menu_items WHERE id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $item['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $currentStock = $result->fetch_assoc()['stock_quantity'];

        $query = "INSERT INTO stock_movements (menu_item_id, movement_type, quantity_change, previous_stock, new_stock, user_id) 
                  VALUES (?, 'sale', ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $negativeQuantity = -$item['quantity'];
        $previousStock = $currentStock + $item['quantity'];
        $stmt->bind_param(
            "iiiii",
            $item['id'],
            $negativeQuantity,
            $previousStock,
            $currentStock,
            $_SESSION['user_id']
        );
        $stmt->execute();
    }

    $conn->commit();
    echo json_encode(['success' => true, 'order_number' => $orderNumber]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Error processing order: ' . $e->getMessage()]);
}
?>
