const express = require('express');
const app = express();
const session = require('express-session');
const func = require('./lib/func');
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const cors = require('cors');
app.use(cors());
const mysql = require('mysql2');
const multer = require('multer');
const db = require('./lib/db');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());  // 🔥 JSON 요청을 파싱하기 위해 필요함!
app.use(session({
    secret: 'my-secret-key',   // 🔥 세션 암호화 키 (랜덤한 값으로 설정!)
    resave: false,            // 변경 사항 없을 때도 계속 저장할지 여부 (false 추천)
    saveUninitialized: true,   // 초기화되지 않은 세션을 저장할지 여부 (true)
    cookie: {
        // secure: true,          // 🔥 HTTPS에서만 쿠키 전송 (HTTP에서는 false)
        httpOnly: true,        // 🔥 JavaScript에서 쿠키 접근 불가 (XSS 방지)
        sameSite: 'strict',    // 🔥 동일 사이트에서만 쿠키 전송 (CSRF 방지)
        maxAge: 1000 * 60 * 60 // 1시간 후 세션 만료
    }
}));

const usersRouter = require('./routes/login');  // 라우터 가져오기
app.use('/login', usersRouter);
const postRouter = require('./routes/post');
app.use('/post', postRouter);
const categoryRouter = require('./routes/category');
app.use('/category', categoryRouter);
const profileRouter = require('./routes/profile');
app.use('/profile', profileRouter);


app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
    res.render('index', { ... await func.is_user(req, res), ... await func.getProducts(req, res), ... await func.getRating(req,res),... await func.getPremium(req,res)});
})
app.get('/getPremium', async (req, res) => {
    const offset = parseInt(req.query.offset, 10) || 0;
    console.log(`이건 서버에서 보낸 오프셋 ${offset}`)
    await new Promise((resolve, reject) => {
        db.query(
            'SELECT * FROM post WHERE is_premium = 1 ORDER BY date DESC LIMIT 4 OFFSET ? ',
            [offset],
            (err, results) => {
                if (err) {
                    return reject(err);
                }
                // 결과를 반환해야 하면 여기서 변수에 담아두거나,
                // 혹은 프런트에 바로 res.json() 해도 된다 (상황에 따라 다름).
               
                res.json(results);
                resolve();
            }
        );
    });
});

app.get('/getProducts', async (req, res) => {
    const offset = parseInt(req.query.offset, 10) || 0;
    console.log(`이건 서버에서 보낸 오프셋 ${offset}`)
    await new Promise((resolve, reject) => {
        db.query(
            `SELECT
  p.*, ROUND(AVG(r.rating), 1) AS avg_rating
FROM post p
LEFT JOIN review r ON p.id = r.reviewed_product
GROUP BY p.id
ORDER BY p.id DESC
LIMIT 8 OFFSET 0`,
            [offset],
            (err, results) => {
                if (err) {
                    return reject(err);
                }
                // 결과를 반환해야 하면 여기서 변수에 담아두거나,
                // 혹은 프런트에 바로 res.json() 해도 된다 (상황에 따라 다름).
            
                res.json(results);
                resolve();
            }
        );
    });
});
app.get('/specifics/review', async (req, res) => {

    let id = req.query.products;
    res.render('rating', { ... await func.is_user(req, res), ...await func.specifics(req, res, id), ... await func.getRating(req,res,id)});
})
app.get('/specifics/:id', async (req, res) => {
    let id = req.params.id;
    res.render('specificpage', { ... await func.is_user(req, res), ...await func.specifics(req, res, id) , ...await func.getRating(req,res,id)});
})
app.get('/board', async (req, res) => {
    res.render('board', { ... await func.is_user(req, res), ...await func.getProducts(req, res) });
})

app.post('/review/upload', upload.array('reviewImages'), async (req, res) => {
    try {
        // 1) 별점
        console.log("씨발련",req.session.primarykey);
        const starRating = req.body.starRating;
        // 2) 리뷰 내용
        const reviewContent = req.body.reviewContent;
        const reviewed_product = parseInt(req.body.reviewed_product, 10); 
   
        const files = req.files;
        
        console.log('별점:', starRating);
        console.log('리뷰 내용:', reviewContent);
        console.log('업로드된 파일:', files[0].path);
        db.query('INSERT INTO review (reviewed_product, reviewer_id, content,rating) value(?,?,?,?)',[reviewed_product, req.session.primarykey, reviewContent, starRating],(err,results)=>{
            if(err){
                throw err;
            }
            files.forEach(item=> {
                db.query('INSERT INTO review_img (review_id, image_url) value(?,?)', [results.insertId, item.path])

            })
            

        });


        // 여기서 DB에 INSERT 하는 로직을 구현
        // ex) INSERT INTO review (star_rating, content, ...) VALUES (?, ? ...)
        // 파일 경로나 이름을 DB에 저장하려면, files 배열을 순회하며 file.filename 또는 file.path 저장

        // 완료 후 클라이언트에 응답
        res.send('리뷰 등록 완료!');
    } catch (error) {
        console.error('에러 발생:', error);
        res.status(500).send('서버 에러');
    }
});
app.get('/admin/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        console.log('서버 응답했긴했음')
        if (err) {
            throw err;
        }
        res.json(results);
        console.log(results);
    })
})



app.get('/board', async (req, res) => {
    res.render('board', { ... await func.is_user(req, res), ...await func.getProducts(req, res) });
})

app.get('/admin/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        console.log('서버 응답했긴했음')
        if (err) {
            throw err;
        }
        res.json(results);
        console.log(results);
    })
})

app.get('/admin/post', (req, res) => {
    db.query(`SELECT post.id, post.title, post.description, post.image_url, 
       post.date, post.user_id, post.price, post.category, post.review, post.is_premium,post.profile AS user_profile,
       users.username, users.profile, users.userid, users.password
FROM post
LEFT JOIN users ON post.user_id = users.id`, (err, results) => {
        console.log('서버 응답했긴했음')
        if (err) {
            throw err;
        }
        res.json(results);
        console.log(results);
    })
})
app.post(`/admin/edit/users`, (req, res) => {
    
    console.log(`응 /admin/edit/users 에딧 요청왔어 `, req.body);
    const query = `UPDATE users Set password = ? WHERE userid = ?`;
    console.log('일케 들어감', query)
    db.query(query, [req.body.password,req.body.userid], err => {
        res.status(200).json({ message: "응 삭제했음" });  // ✅ HTTP 상태 코드(200) + JSON 형식 응답
    })

})

app.delete(`/admin/delete/select/users`, (req, res) => {
    const { selectItems } = req.body;
    console.log(`응 맨위 파라미터 로 왔어 `, selectItems);
    const placeholder = selectItems.map(() => "?").join(", ");
    const query = `DELETE FROM users WHERE userid IN (${placeholder})`;
    console.log('일케 들어감', query)
    db.query(query, selectItems, err => {
        res.status(200).json({ message: "응 삭제했음" });  // ✅ HTTP 상태 코드(200) + JSON 형식 응답
    })

})
app.delete(`/admin/delete/select/posts`, (req, res) => {
    console.log('일단 포스트 선택삭제 창에 오신걸 환영합니당')
    const { selectPosts } = req.body;
    console.log(selectPosts);
    const placeholder = selectPosts.map(() => "?").join(", ");
    const query = `DELETE FROM post WHERE id IN (${placeholder})`;
    console.log('일케 들어감', query)
    db.query(query, selectPosts, err => {
        res.status(200).json({ message: "응 삭제했음" });  // ✅ HTTP 상태 코드(200) + JSON 형식 응답
    })

})

app.delete(`/admin/delete/users/:id`, (req, res) => {
    const userid = req.params.id;
    console.log(`응 여기 파라미터 로 오긴옴 `, userid);

    db.query(`DELETE FROM users WHERE username=?`,[userid], err => {
        
        if (err) {
            throw err;
        }
        res.status(200).json({ message: "응 삭제했음" });  // ✅ HTTP 상태 코드(200) + JSON 형식 응답
        
    })
})

app.delete(`/admin/delete/posts/:id`, (req, res) => {
    const id = req.params.id;
    console.log(`DELETE FROM post WHERE username=${id} 이렇게 들어갈거임`);

    db.query(`DELETE FROM post WHERE username=?`, [id], err => {

        if (err) {
            throw err;
        }
        res.status(200).json({ message: "응 삭제했음" });  // ✅ HTTP 상태 코드(200) + JSON 형식 응답

    })
})

app.use((req, res, next) => {
    res.status(404).render('404', { message: '페이지를 찾을 수 없습니다.' });
});


// app.listen(3000, () => console.log('정상 작동'));
module.exports = app;