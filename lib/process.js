const mysql = require('mysql2');
const func = require('./func');
const path = require('path');
const fs = require('fs');
const profilepath= '/uploads/images/profile';
const postpath = '/uploads/images/post';
const crypto = require("crypto");
const db = require('./db');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
require('dotenv').config(); // .env에서 AWS 키를 불러온다는 가정
const s3 = require('./s3');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

exports.loginProcess = async function (req, res) {
    const { username, password } = req.body;
    console.log(username,password);
    await new Promise(resolve => {


        db.query('SELECT * FROM users WHERE userid=? AND password=?', [username, password], (err, results) => {
            if (err) {
                throw err;
            }
            if (results.length > 0) {
                // req.session.username = results[0].username;
                req.session.primarykey = results[0].id;
                req.session.save(() => {
                    console.log('로그인 시켜서 보냈따');
                    console.log(`유저 id와 닉네임 ${req.session.primarykey} ${results[0].username}`)
                    console.log(results[0]);
                    res.json({success:true, user: results[0]});

                })
            } else {
                console.log('비번 틀려서 그냥 보냈따');
                res.json({success:false, message:'비번이 틀립니다'})
            }

            resolve();
        })



    })
} 
exports.signupProcess = async function (req, res) {

    await new Promise(resolve => {

        if (req.body.password != req.body.passwordConfirm) {
            res.redirect(302, '/login');
        } else {
            db.query('SELECT * FROM users WHERE userid=?', [req.body.id], (err, results) => {

                if (err) {
                    throw err;
                }
                if (results.length > 0) {
                    res.send('아이디가 이미 존재합니다');
                } else {
                    db.query('INSERT INTO users (username,userid,password,profile) values(?,?,?,?)', [req.body.name, req.body.id, req.body.password, '/uploads/unknown.jpg'], (err, results) => {

                        if (err) {
                            throw err;
                        }
                        req.session.username = req.body.name;
                        req.session.save(() => {
                            res.redirect(302, '/');
                            console.log('비번이 이상하잖아')
                        })

                    });
                }
                resolve();
            })
        }


    })

}


exports.postProcess = async function (req, res) {
    let imageUrl = null;
    let is_premium = 0;
     if (req.file) {
    
                // ✅ 랜덤한 파일명 생성 (예: d9f4a3b8-abc123.png)
                const uniqueFilename = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;
                const s3Key = `${postpath}/${uniqueFilename}`;
                const params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: s3Key,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype
                };
                    await s3.send(new PutObjectCommand(params));

                    // S3 URL 저장
                    imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
            }
        if(req.body.action==='premium'){
            is_premium = 1;
            await new Promise(resolve => {


                db.query(`UPDATE users SET premium_slots = premium_slots - 1 WHERE id = ? `, [req.session.primarykey],(err,results)=>{
                    resolve();
                })

            })
            
        }
        await new Promise(resolve => {

        db.query(`INSERT INTO post (title, description, image_url, date, user_id, price, category, is_premium) values(?,?,?,NOW(),?,?,?,?)`, [req.body.title, req.body.description, imageUrl, req.session.primarykey, req.body.price, req.body.category, is_premium], (err, results) => {
            if (err) {
                throw err;
            }

            res.redirect(302, '/');
            resolve();
        })



    })
}


exports.profileProcess = async function (req, res) {
    await new Promise(async function (resolve) {
        

        let imageUrl = null;
        if (req.file) {
            // ✅ 랜덤한 파일명 생성 (예: d9f4a3b8-abc123.png)
            const uniqueFilename = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;
            imageUrl = `${profilepath}/${uniqueFilename}`;

            // ✅ 파일명 변경 (저장 경로 설정)
            const fs = require("fs");
            fs.renameSync(req.file.path, path.join(__dirname, `..${profilepath}`, uniqueFilename));
        }

        
        db.query(`UPDATE users SET profile = ? WHERE id = ?`, [imageUrl, req.session.primarykey], (err, results) => {
            if (err) {
                throw err;
            }
            console.log(results);

            resolve();
        });

        res.json({
            success: true,
            message: "프로필 이미지가 성공적으로 업데이트되었습니다.",
            imageUrl: imageUrl
        });
    });
};

exports.deleteProcess = async function (req, res) {
    const productId = req.body.id;

    if (!productId) {
        return res.json({ success: false, message: '삭제할 게시글의 ID가 이상합니다.' });
    }

    try {
        // 1️⃣ 삭제할 게시글의 이미지 URL 조회
        const imageUrl = await new Promise((resolve, reject) => {
            db.query('SELECT image_url FROM post WHERE id=?', [productId], (err, results) => {
                if (err) {
                    console.error('DB 조회 오류:', err);
                    return reject(new Error('데이터베이스 조회 오류 발생'));
                }
                if (results.length === 0) {
                    return reject(new Error('게시글을 찾을 수 없습니다.'));
                }
                resolve(results[0].image_url);
            });
        });

        // 2️⃣ 게시글 삭제
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM post WHERE id=?', [productId], (deleteErr, deleteResults) => {
                if (deleteErr) {
                    console.error('DB 삭제 오류:', deleteErr);
                    return reject(new Error('게시글 삭제 실패'));
                }
                console.log("✅ DB 삭제 완료:", productId);
                resolve();
            });
        });

        // 3️⃣ 파일 삭제 (이미지가 존재하는 경우)
        if (imageUrl) {
            const imagePath = path.resolve(__dirname, '../uploads', path.basename(imageUrl));
            console.log('🗑️ 삭제할 이미지 경로:', imagePath);
            console.log('여기가 경로다', imagePath);

            await new Promise((resolve, reject) => {
                fs.unlink(imagePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('파일 삭제 오류:', unlinkErr);
                        return reject(new Error('파일 삭제 실패'));
                    }
                    console.log('✅ 실제 이미지 삭제 완료:', imagePath);
                    resolve();
                });
            });
        }

        // 4️⃣ 최종 응답 반환
        return res.json({ success: true, redirectUrl: '/profile' });

    } catch (error) {
        console.error('❌ 삭제 중 오류 발생:', error.message);
        return res.json({ success: false, message: error.message });
    }
};