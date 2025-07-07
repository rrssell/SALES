
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

    $query = "INSERT INTO store_logs (cashier_id, action) VALUES (?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("is", $_SESSION['user_id'], $input['action']);
    $stmt->execute();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
