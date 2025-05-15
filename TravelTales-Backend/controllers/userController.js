const sqlite3 = require('sqlite3').verbose();
const DB_NAME = 'TravelTales.db';
const db = new sqlite3.Database(DB_NAME);

// Get user data including followers and following
const getUserById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get user basic info
    db.get(`SELECT id, name, profile_picture, banner_picture, email FROM users WHERE id = ?`, [id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get followers
      db.all(`
        SELECT u.id, u.name, u.profile_picture 
        FROM users u 
        INNER JOIN followers f ON u.id = f.followerId 
        WHERE f.userId = ?
      `, [id], (err, followers) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Get following
        db.all(`
          SELECT u.id, u.name, u.profile_picture 
          FROM users u 
          INNER JOIN followings f ON u.id = f.followingId 
          WHERE f.userId = ?
        `, [id], (err, following) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Get counts
          db.get(`
            SELECT 
              (SELECT COUNT(*) FROM followers WHERE userId = ?) as followerCount,
              (SELECT COUNT(*) FROM followings WHERE userId = ?) as followingCount
          `, [id, id], (err, counts) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              ...user,
              followers,
              following,
              followerCount: counts.followerCount,
              followingCount: counts.followingCount
            });
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user profile
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, profile_picture, banner_picture } = req.body;

  try {
    db.run(`
      UPDATE users 
      SET name = COALESCE(?, name),
          profile_picture = COALESCE(?, profile_picture),
          banner_picture = COALESCE(?, banner_picture)
      WHERE id = ?
    `, [name, profile_picture, banner_picture, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Toggle follow status
const toggleFollow = async (req, res) => {
  const { userId, followerId } = req.body;

  if (userId === followerId) {
    return res.status(400).json({ error: 'Users cannot follow themselves' });
  }

  try {
    // Check if already following
    db.get(`SELECT * FROM followers WHERE userId = ? AND followerId = ?`, 
    [userId, followerId], (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        // Unfollow - remove from both tables
        db.run(`BEGIN TRANSACTION`);
        db.run(`DELETE FROM followers WHERE userId = ? AND followerId = ?`, 
        [userId, followerId]);
        db.run(`DELETE FROM followings WHERE userId = ? AND followingId = ?`, 
        [followerId, userId], function(err) {
          if (err) {
            db.run(`ROLLBACK`);
            return res.status(500).json({ error: 'Database error' });
          }
          db.run(`COMMIT`);
          res.json({ message: 'Unfollowed successfully' });
        });
      } else {
        // Follow - add to both tables
        db.run(`BEGIN TRANSACTION`);
        db.run(`INSERT INTO followers (userId, followerId) VALUES (?, ?)`, 
        [userId, followerId]);
        db.run(`INSERT INTO followings (userId, followingId) VALUES (?, ?)`, 
        [followerId, userId], function(err) {
          if (err) {
            db.run(`ROLLBACK`);
            return res.status(500).json({ error: 'Database error' });
          }
          db.run(`COMMIT`);
          res.json({ message: 'Followed successfully' });
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserById,
  updateUser,
  toggleFollow
}; 