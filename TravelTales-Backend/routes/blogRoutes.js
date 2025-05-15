const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('TravelTales.db');
const { getCountryInfo } = require('../libs/contry');

router.post('/', async (req, res) => {
    const { user_id, title, description, content, country_name, main_image, visit_date } = req.body;
    
    try {
        const stmt = db.prepare(`
            INSERT INTO blogs (user_id, title, description, content, country_name, main_image, visit_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([user_id, title, description, content, country_name, main_image, visit_date], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to create blog post' });
            }
            res.status(201).json({ id: this.lastID, message: 'Blog post created successfully' });
        });
        
        stmt.finalize();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all blog posts
router.get('/', (req, res) => {
    db.all(`
        SELECT b.*, 
            u.id as user_id,
            u.name as user_name,
            u.profile_picture as user_profile_picture,
            (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as likes_count,
            (SELECT COUNT(*) FROM blog_dislikes WHERE blog_id = b.id) as dislikes_count
        FROM blogs b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
    `, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch blogs' });
        }

        // Format the response to include user information
        const formattedRows = rows.map(row => ({
            ...row,
            user: {
                id: row.user_id,
                name: row.user_name,
                profile_picture: row.user_profile_picture
            }
        }));

        // Remove duplicate user fields from the root level
        formattedRows.forEach(row => {
            delete row.user_name;
            delete row.user_profile_picture;
        });

        res.json(formattedRows);
    });
});

// Get a specific blog post
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT b.*, 
            u.id as user_id,
            u.name as user_name,
            u.profile_picture as user_profile_picture,
            (SELECT COUNT(*) FROM blog_likes WHERE blog_id = b.id) as likes_count,
            (SELECT COUNT(*) FROM blog_dislikes WHERE blog_id = b.id) as dislikes_count
        FROM blogs b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
    `, [id], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch blog' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Format the response to match the frontend expectations
        const response = {
            ...row,
            user: {
                id: row.user_id,
                name: row.user_name,
                profile_picture: row.user_profile_picture
            }
        };

        // Remove the duplicate user fields from the root level
        delete response.user_name;
        delete response.user_profile_picture;

        res.json(response);
    });
});

// Update a blog post
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, content, country_name, main_image, visit_date } = req.body;
    
    const stmt = db.prepare(`
        UPDATE blogs 
        SET title = ?, description = ?, content = ?, country_name = ?, main_image = ?, 
            visit_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run([title, description, content, country_name, main_image, visit_date, id], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to update blog post' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json({ message: 'Blog post updated successfully' });
    });
    
    stmt.finalize();
});

// Delete a blog post
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM blogs WHERE id = ?', [id], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to delete blog post' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json({ message: 'Blog post deleted successfully' });
    });
});

// Handle likes and dislikes
router.post('/:id/reaction', async (req, res) => {
    const { id } = req.params;
    const { user_id, action } = req.body; // action can be 'like', 'dislike', or 'none'
    
    if (!['like', 'dislike', 'none'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    db.serialize(() => {
        // Begin transaction
        db.run('BEGIN TRANSACTION');
        
        try {
            // First, remove any existing reactions from this user on this blog
            db.run('DELETE FROM blog_likes WHERE user_id = ? AND blog_id = ?', [user_id, id]);
            db.run('DELETE FROM blog_dislikes WHERE user_id = ? AND blog_id = ?', [user_id, id]);
            
            // Then add the new reaction only if it's not 'none'
            if (action === 'like') {
                db.run('INSERT INTO blog_likes (user_id, blog_id) VALUES (?, ?)', [user_id, id]);
            } else if (action === 'dislike') {
                db.run('INSERT INTO blog_dislikes (user_id, blog_id) VALUES (?, ?)', [user_id, id]);
            }
            
            // Get updated counts
            db.get(`
                SELECT 
                    (SELECT COUNT(*) FROM blog_likes WHERE blog_id = ?) as likes_count,
                    (SELECT COUNT(*) FROM blog_dislikes WHERE blog_id = ?) as dislikes_count
            `, [id, id], (err, counts) => {
                if (err) {
                    console.error(err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to get updated counts' });
                }
                
                // Commit transaction
                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Failed to update reaction' });
                    }
                    res.json({ 
                        message: 'Reaction updated successfully',
                        likes_count: counts.likes_count,
                        dislikes_count: counts.dislikes_count
                    });
                });
            });
        } catch (error) {
            db.run('ROLLBACK');
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    });
});

// Get user's reaction to a blog
router.get('/:id/reaction/:userId', (req, res) => {
    const { id, userId } = req.params;
    
    db.serialize(() => {
        db.get('SELECT 1 FROM blog_likes WHERE user_id = ? AND blog_id = ?', [userId, id], (err, likeRow) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Server error' });
            }
            
            db.get('SELECT 1 FROM blog_dislikes WHERE user_id = ? AND blog_id = ?', [userId, id], (err, dislikeRow) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Server error' });
                }
                
                let reaction = 'none';
                if (likeRow) reaction = 'like';
                if (dislikeRow) reaction = 'dislike';
                
                res.json({ reaction });
            });
        });
    });
});

// Get country information for a blog post
router.get('/:id/country-info', async (req, res) => {
    try {
        // First get the blog post to get the country name
        const { id } = req.params;
        
        db.get('SELECT country_name FROM blogs WHERE id = ?', [id], async (err, blog) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to fetch blog' });
            }
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }

            try {
                const countryInfo = await getCountryInfo(blog.country_name);
                res.json(countryInfo[0]); // Send first match as we expect one country
            } catch (error) {
                console.error('Error fetching country info:', error);
                res.status(500).json({ error: 'Failed to fetch country information' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 