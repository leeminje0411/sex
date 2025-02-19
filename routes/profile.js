const express = require('express');
const router = express.Router();
const multer = require('multer');
const func = require('../lib/func');
const process = require('../lib/process');
const path = require('path');
const mysql = require('mysql2');
const profilepath = "/uploads/images/profile";
const postpath = '/uploads/images/post';
db = require('../lib/db');
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

router.get('/',async (req, res) => {
    res.render('profile', { ...await func.is_user(req, res), ...await func.myproducts(req, res) });
})

router.post('/upload', upload.single('image'), async (req, res) => {
    await process.profileProcess(req, res);
})

router.post('/products/delete', async (req, res) => {
    await process.deleteProcess(req, res);
});

router.post('/edit', upload.single("image"), async (req, res) => {

    try {
        const primarykey= req.session.primarykey; // 로그인된 사용자 ID
        const { nickname, bio } = req.body; // 일반 텍스트 데이터

        let imageUrl = null;

        // ✅ 사진이 있을 경우에만 처리
        if (req.file) {

            // ✅ 랜덤한 파일명 생성 (예: d9f4a3b8-abc123.png)
            const uniqueFilename = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;
            imageUrl = `${profilepath}/${uniqueFilename}`;

            // ✅ 파일명 변경 (저장 경로 설정)
            const fs = require("fs");
            fs.renameSync(req.file.path, path.join(__dirname, `..${profilepath}`, uniqueFilename));
        }

        console.log("닉네임:", nickname);
        console.log("한 줄 소개:", bio);
        console.log("업로드된 파일:", req.file);
        console.log(`UPDATE users SET username = ${nickname}, bio = ${bio} WHERE id = ${primarykey}`); // 파일 정보 확인

    

        let a = await new Promise(resolve=>{
            if (imageUrl) {
                db.query(
                    "UPDATE users SET username = ?, bio = ?, profile = ? WHERE id= ?",
                    [nickname, bio, imageUrl, primarykey],(err,results)=>{
                        resolve(results);
                    }
                );
                
            } else {
                db.query(
                    "UPDATE users SET username = ?, bio = ? WHERE id = ?",
                    [nickname, bio, primarykey], (err, results) => {
                        resolve(results);
                    }
                );
                
            }
            })
          
          let b =  await new Promise(resolve=> 
                db.query('SELECT * FROM USERS WHERE id = ?',[primarykey],(err,results)=>{
                        resolve(results[0])
                     })
                    )
       
        console.log(`b.username은 이거다!! ${b.username}`)
        res.json({
            success: true,
            username: b.username,
            bio: b.bio,
            profileImage: b.profile
        });

    } catch (error) {
        console.error("프로필 업데이트 오류:", error);
        res.json({ success: false, message: "업데이트 실패" });
    }
});

router.post('/products/edit', async (req, res) => {
    console.log('모달 요청을 보내 니가?')
    
    await new Promise(resolve=>{

        db.query('SELECT * FROM post WHERE id = ?', [req.body.id],
            (err,results)=>{
                console.log(results);
                res.json({
                    success: true,
                    data: results
                });
               
                
                resolve();
            }
        )
        })
});

router.post("/products/update", upload.single("image"), async (req, res) => {
    try {
        let imageUrl = null;
        const { id, title, price, description, category } = req.body;
        

        if (req.file) {
            const uniqueFilename = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;
            imageUrl = `${postpath}/${uniqueFilename}`;

            // ✅ 파일명 변경 (저장 경로 설정)
            const fs = require("fs");
            fs.renameSync(req.file.path, path.join(__dirname, `..${postpath}`, uniqueFilename));
        }

        // ✅ DB 업데이트 쿼리
        const query = imageUrl
            ? "UPDATE post SET title = ?, price = ?, description = ?, category = ?, image_url = ? WHERE id = ?"
            : "UPDATE post SET title = ?, price = ?, description = ?, category = ? WHERE id = ?";

        const values = imageUrl ? [title, price, description, category, imageUrl, id] : [title, price, description, category, id];

        await new Promise((resolve, reject) => {
            db.query(query, values, (err, result) => {
                if (err) {
                    console.error("DB 업데이트 오류:", err);
                    return reject(err);
                }
                resolve(result);
            });
        });

        res.json({
            success: true,
            message: "업데이트 완료",
            imageUrl: imageUrl, // 이미지가 변경되었을 경우 새 URL 반환
        });

    } catch (error) {
        console.error("업데이트 중 오류:", error);
        res.json({ success: false, message: "업데이트 실패" });
    }
});

router.post('/accountSetting', async (req, res) => {
    const { currentPw, newPw } = req.body;

    await new Promise(resolve => {

        db.query('SELECT password FROM users WHERE id = ?', [req.session.primarykey],
            (err, results) => {

                if(results[0].password === currentPw){

                    db.query('UPDATE users SET password = ? WHERE id =?',[newPw, req.session.primarykey],(err,results)=>{
                        res.json({ success: true});
                        resolve();
                    })
                  }}
                )
            })
        });


module.exports = router;