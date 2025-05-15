const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('TravelTales.db');

// Get comments for a blog post
router.get('/blog/:blogId', (req, res) => {
    const { blogId } = req.params;
    
    db.all(`
        SELECT c.*,
            u.name as user_name,
            u.profile_picture as user_profile_picture
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.blog_id = ?
        ORDER BY c.created_at DESC
    `, [blogId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch comments' });
        }

        // Format the response
        const comments = rows.map(row => ({
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            updated_at: row.updated_at,
            user: {
                id: row.user_id,
                name: row.user_name,
                profile_picture: row.user_profile_picture
            }
        }));

        res.json(comments);
    });
});

// Add a new comment
router.post('/', (req, res) => {
    const { blog_id, user_id, content } = req.body;
    
    if (!blog_id || !user_id || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
        INSERT INTO comments (blog_id, user_id, content)
        VALUES (?, ?, ?)
    `);
    
    stmt.run([blog_id, user_id, content], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create comment' });
        }

        // Fetch the created comment with user details
        db.get(`
            SELECT c.*,
                u.name as user_name,
                u.profile_picture as user_profile_picture
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [this.lastID], (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to fetch created comment' });
            }

            const comment = {
                id: row.id,
                content: row.content,
                created_at: row.created_at,
                updated_at: row.updated_at,
                user: {
                    id: row.user_id,
                    name: row.user_name,
                    profile_picture: row.user_profile_picture
                }
            };

            res.status(201).json(comment);
        });
    });
    
    stmt.finalize();
});

// Update a comment
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    const stmt = db.prepare(`
        UPDATE comments 
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run([content, id], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to update comment' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json({ message: 'Comment updated successfully' });
    });
    
    stmt.finalize();
});

// Delete a comment
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to delete comment' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json({ message: 'Comment deleted successfully' });
    });
});

module.exports = router; 