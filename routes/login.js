const express = require('express');
const router = express.Router();
const func = require('../lib/func');
const process = require('../lib/process');
const multer = require('multer');
const upload = multer(); // 디스크 저장 대신 메모리 저장 etc.
router.get('/', async (req, res) => {
    res.render('login', { ...await func.is_user(req, res), ... await func.getProducts(req, res) });
})

router.post('/process', upload.none(), async (req, res) => {
    await process.loginProcess(req, res);
})

router.get('/signup', async (req, res) => {
    res.render('signup', { ... await func.is_user(req, res), ... await func.getProducts(req, res) });
})

router.post('/signup/process', async (req, res) => {
    await process.signupProcess(req, res);
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect(302, '/');
})

module.exports = router;