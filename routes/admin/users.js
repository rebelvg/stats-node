const express = require('express');

let router = express.Router();

const userController = require('../../controllers/admin/users');

router.get('/', userController.find);

module.exports = router;
