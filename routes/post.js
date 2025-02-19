const express = require('express');
const router = express.Router();
const multer = require('multer');
const func = require('../lib/func');
const process = require('../lib/process');
const path = require('path');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



router.get('/', async (req, res) => {
    res.render('post', await func.is_user(req, res));
})

router.get('/check', (req, res) => {
    if (req.session.username) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
})

router.post('/process', upload.single('image'), async (req, res) => {
    await process.postProcess(req, res);
}
)

module.exports = router;