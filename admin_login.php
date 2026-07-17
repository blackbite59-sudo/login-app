<?php
require_once __DIR__ . '/functions.php';
if (isAdminAuthenticated()) { header('Location: admin.php'); exit; }
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    if (($username === ADMIN_USER && $password === ADMIN_PASS)) {
        $_SESSION['admin_logged_in'] = true; $_SESSION['admin_username'] = $username;
        header('Location: admin.php'); exit;
    }
    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = :u LIMIT 1");
    $stmt->execute([':u' => $username]);
    $user = $stmt->fetch();
    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['admin_logged_in'] = true; $_SESSION['admin_username'] = $username;
        header('Location: admin.php'); exit;
    }
    $error = 'Invalid username or password.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Admin Login</title><link rel="stylesheet" href="styles/admin.css"></head>
<body class="login-page">
<div class="login-container">
    <div class="login-card">
        <div class="login-header">
            <div class="login-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg></div>
            <h1>Admin Panel</h1><p>Enter your credentials</p>
        </div>
        <?php if ($error): ?><div class="alert alert-error"><?php echo sanitizeOutput($error); ?></div><?php endif; ?>
        <form method="post" class="login-form" autocomplete="off">
            <div class="form-group"><label for="username">Username</label><input type="text" id="username" name="username" placeholder="admin" required autofocus></div>
            <div class="form-group"><label for="password">Password</label><input type="password" id="password" name="password" placeholder="admin123" required></div>
            <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>
    </div>
</div>
</body>
</html>
