
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

    $conn->autocommit(FALSE);

    // Get current stock
    $query = "SELECT stock_quantity FROM menu_items WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $input['item_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $currentStock = $result->fetch_assoc()['stock_quantity'];

    // Update stock
    $query = "UPDATE menu_items SET stock_quantity = stock_quantity + ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $input['quantity'], $input['item_id']);
    $stmt->execute();

    // Record stock movement
    $query = "INSERT INTO stock_movements (menu_item_id, movement_type, quantity_change, previous_stock, new_stock, user_id) 
              VALUES (?, 'restock', ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $newStock = $currentStock + $input['quantity'];
    $stmt->bind_param(
        "iiiii",
        $input['item_id'],
        $input['quantity'],
        $currentStock,
        $newStock,
        $_SESSION['user_id']
    );
    $stmt->execute();

    $conn->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
