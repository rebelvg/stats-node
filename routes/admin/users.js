const express = require('express');

const router = express.Router();

const userController = require('../../controllers/admin/users');

router.get('/', userController.find);
router.put('/:id', userController.update);

module.exports = router;
