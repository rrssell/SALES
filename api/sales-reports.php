<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

require_once '../config/database.php';

try {
    $startDate = $_GET['start_date'] ?? date('Y-m-d');
    $endDate = $_GET['end_date'] ?? date('Y-m-d');

    // Get sales summary
    $query = "SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_orders,
                SUM(total_amount) as total_sales,
                AVG(total_amount) as average_order
              FROM orders 
              WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
              GROUP BY DATE(created_at)
              ORDER BY DATE(created_at) DESC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    $dailySales = $result->fetch_all(MYSQLI_ASSOC);

    // Get totals
    $query = "SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_sales,
                AVG(total_amount) as average_order
              FROM orders 
              WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    $totals = $result->fetch_assoc();

    // Check for CSV export request
    if (isset($_GET['export']) && $_GET['export'] === 'csv') {
        // Set headers for CSV download
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="sales_report_' . $startDate . '_to_' . $endDate . '.csv"');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Open output stream
        $output = fopen('php://output', 'w');

        // Write CSV headers
        fputcsv($output, ['Date', 'Total Orders', 'Total Sales (₱)', 'Average Order (₱)']);

        // Write daily sales data
        foreach ($dailySales as $row) {
            fputcsv($output, [
                $row['date'],
                $row['total_orders'],
                number_format($row['total_sales'], 2, '.', ''),
                number_format($row['average_order'], 2, '.', '')
            ]);
        }

        // Write totals as a footer row
        fputcsv($output, ['Totals', $totals['total_orders'], number_format($totals['total_sales'], 2, '.', ''), number_format($totals['average_order'], 2, '.', '')]);

        fclose($output);
        exit();
    }

    // Default JSON response
    header('Content-Type: application/json');
    echo json_encode([
        'dailySales' => $dailySales,
        'totals' => $totals,
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
