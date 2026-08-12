const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getEntries, getEntry, createEntry, updateEntry, deleteEntry } = require('../controllers/entryController');

router.use(protect);
router.get('/', getEntries);
router.post('/', createEntry);
router.get('/:id', getEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

module.exports = router;
