const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const authController = require('../controllers/authController');
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('TravelTales.db');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.post('/verify-reset-credentials', async (req, res) => {
    const { name, email } = req.body;
    console.log("🚀 ~ router.post ~ name:", name)
    console.log("🚀 ~ router.post ~ email:", email)
    try {
        db.get(
            'SELECT id FROM users WHERE name = ? AND email = ?',
            [name, email],
            (err, user) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Server error' });
                }
                if (!user) {
                    return res.status(404).json({ error: 'User not found with these credentials' });
                }
                res.json({ verified: true, userId: user.id });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { userId, newPassword } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        db.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, userId],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Failed to update password' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.json({ message: 'Password updated successfully' });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
