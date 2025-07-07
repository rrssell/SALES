<?php
require_once 'config/database.php';

echo "Database connection test:<br>";
echo "Server: " . $servername . "<br>";
echo "Database: " . $dbname . "<br>";

if ($conn->connect_error) {
    echo "Connection failed: " . $conn->connect_error;
} else {
    echo "Connection successful!<br>";

    // Test a simple query
    $result = $conn->query("SHOW TABLES");
    if ($result) {
        echo "Tables in database:<br>";
        while ($row = $result->fetch_array()) {
            echo "- " . $row[0] . "<br>";
        }
    }
}
