const db = require('./db');

exports.is_user = async function (req, res) {
    let obj = {};
    await new Promise(resolve => {
        if (req.session.primarykey) {

            db.query('SELECT * FROM users WHERE id =?', [req.session.primarykey], (err, results) => {
                if (err) {
                    throw err;
                }
                const data = results[0];
                
                obj = { username: data };
                resolve();
            })
        } else {
            obj = { username: false }
            resolve();
        }

    }
    )
    return obj;

}

exports.getPremium = async function (req, res) {

    let obj = {};
    await new Promise(resolve => {

        db.query('SELECT * FROM post WHERE is_premium = 1 ORDER BY date DESC LIMIT 4 OFFSET 0 ' , (err, results) => {
            if (err) {
                throw err;
            }

            obj = { premium : results }

            resolve();
        }
        )
    })
    return obj;
}
exports.getProducts = async function (req, res) {

    let obj = {};
    await new Promise(resolve => {

        db.query(`SELECT
  p.*,ROUND(AVG(r.rating), 1) AS avg_rating
FROM post p
LEFT JOIN review r ON p.id = r.reviewed_product
GROUP BY p.id
ORDER BY p.id DESC
LIMIT 8 OFFSET 0`, (err, results1) => {
            if (err) {
                throw err;
            }
            
                console.log(results1);
                obj = { post: results1 }

                resolve();
      
       
    })})
    return obj;
}

exports.category = async function (req, res, num) {
    let obj = {};
    await new Promise(resolve => {

        db.query(`SELECT * FROM post WHERE category=? ORDER BY date DESC `, [num], (err, results) => {
            if (err) {
                throw err;
            }
            if (req.session.username) {
                obj = { username: req.session.username, post: results }
                // res.render('index', );
            } else {

                obj = { username: false, post: results }

            }
            resolve();
        }
        )
    })
    return obj;
}

exports.specifics = async function (req, res, id) {

    let obj = {};
    await new Promise(resolve => {

        db.query(`SELECT * FROM post WHERE Id=?`, [id], (err, results) => {
            const result = results[0];
            const author = results[0].user_id;
            db.query(`SELECT * FROM users WHERE id=?`,[author], (err, results)=>{

                obj = { specifics: result, author: results[0] }
                
                resolve();
                })
                }
          )
        }

    )
    return obj;
}

exports.myproducts = async function (req, res) {
    let obj = {}
    await new Promise(resolve => {

        db.query(`SELECT * FROM post WHERE user_id= ?`, [req.session.primarykey], (err, results) => {
            if (err) {
                throw err;
            }
            obj = { post: results }
            resolve();
        })
    })
    return obj;
};

exports.getRating = async function (req, res, productId) {
    let obj = {}
    productId = productId
    await new Promise(resolve => {

        db.query(
            `SELECT reviewed_product, ROUND(AVG(rating), 1) AS avg_rating 
     FROM review 
     WHERE reviewed_product = ? 
     GROUP BY reviewed_product`,
            [productId],
            (err, results) => {
                if (err) {
                    throw err;
                }

                if (results.length === 0) {
                    // ✅ 리뷰가 없으면 기본값 `{ avg_rating: 0 }` 반환
                    obj = { rating: { avg_rating: 0 } };
                } else {
                    obj = { rating: results[0] };
                }

                resolve();
            }
        );
    })
    return obj;
};
