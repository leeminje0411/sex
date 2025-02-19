const express = require('express');
const router = express.Router();
const multer = require('multer');
const func = require('../lib/func');
const process = require('../lib/process');

router.get('/:id', async (req, res) => {
    console.log('뭔가 오긴왔는데');
    let id = req.params.id;
    console.log(id);
    if (id == 1) {
        res.render('category1', { ...await func.category(req, res, 1), name: '디자인', });
    } else if (id == 2) {
        res.render('category1', { ...await func.category(req, res, 2), name: '마케팅', });
    }
    else if (id == 3) {
        res.render('category1', { ...await func.category(req, res, 3), name: '영상/사진/음향', });
    }
    else if (id == 4) {
        res.render('category1', { ...await func.category(req, res, 4), name: 'IT/프로그래밍', });
    } else {
        res.send('있는 걸 입력해라 제발');
    }

})

module.exports = router;