const express = require('express');
const router = express.Router();
const multer = require('multer');
const func = require('../lib/func');
const process = require('../lib/process');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("📂 destination() 실행됨 (파일 저장 위치 설정 중...)");
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        console.log(uniqueName);
        console.log("📂 filename() 실행됨 (파일명 설정 중...):", uniqueName);
        cb(null, uniqueName);
    }
});
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