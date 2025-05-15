const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('TravelTales.db');

// Get user by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`SELECT id, name, profile_picture, banner_picture, email FROM users WHERE id = ?`, [id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// Check follow status
router.get('/follow-status/:targetUserId', (req, res) => {
    const { targetUserId } = req.params;
    const followerId = req.query.followerId;

    if (!followerId) {
        return res.status(400).json({ error: 'Follower ID is required' });
    }

    if (targetUserId === followerId) {
        return res.status(400).json({ error: 'Users cannot follow themselves' });
    }

    db.get(
        'SELECT 1 FROM followers WHERE userId = ? AND followerId = ?',
        [targetUserId, followerId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ isFollowing: !!row });
        }
    );
});

// Follow a user
router.post('/follow/:targetUserId', (req, res) => {
    const { targetUserId } = req.params;
    const followerId = req.query.followerId;

    if (!followerId) {
        return res.status(400).json({ error: 'Follower ID is required' });
    }

    if (targetUserId === followerId) {
        return res.status(400).json({ error: 'Users cannot follow themselves' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Add to followers table
        db.run(
            'INSERT INTO followers (userId, followerId) VALUES (?, ?)',
            [targetUserId, followerId],
            (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Already following this user' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }

                // Add to followings table
                db.run(
                    'INSERT INTO followings (userId, followingId) VALUES (?, ?)',
                    [followerId, targetUserId],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Database error' });
                        }

                        db.run('COMMIT');
                        res.json({ message: 'Successfully followed user' });
                    }
                );
            }
        );
    });
});

// Unfollow a user
router.delete('/unfollow/:targetUserId', (req, res) => {
    const { targetUserId } = req.params;
    const followerId = req.query.followerId;

    if (!followerId) {
        return res.status(400).json({ error: 'Follower ID is required' });
    }

    if (targetUserId === followerId) {
        return res.status(400).json({ error: 'Invalid operation' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Remove from followers table
        db.run(
            'DELETE FROM followers WHERE userId = ? AND followerId = ?',
            [targetUserId, followerId],
            (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Database error' });
                }

                // Remove from followings table
                db.run(
                    'DELETE FROM followings WHERE userId = ? AND followingId = ?',
                    [followerId, targetUserId],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Database error' });
                        }

                        db.run('COMMIT');
                        res.json({ message: 'Successfully unfollowed user' });
                    }
                );
            }
        );
    });
});

module.exports = router; 