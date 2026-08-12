const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

router.use(protect);
router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
