<?php
// See the password_hash() example to see where this came from.
$hash = '$2y$10$.Aja/2ub1yfNFSKgAxa2yejj84rjAGDQ0QiuQJNVQ8v5EouqFTTuS';

if (password_verify('admin123', $hash)) {
    echo 'Password is valid!';
} else {
    echo 'Invalid password.';
}
