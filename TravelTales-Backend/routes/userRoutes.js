const express = require('express');
const router = express.Router();
const { getUserById, updateUser, toggleFollow } = require('../controllers/userController');

router.get('/:id', getUserById);

router.put('/:id', updateUser);

router.post('/follow', toggleFollow);

module.exports = router; 