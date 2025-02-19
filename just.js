exports.is_user = async function (req, res) {
    let obj = {}; // 초기 객체 생성

    await new Promise(resolve => {
        if (req.session.username) {
            // ✅ 세션에 username이 존재하면 DB 조회
            db.query('SELECT * FROM users WHERE username = ?', [req.session.username], (err, results) => {
                if (err) {
                    throw err;
                }

                if (results.length > 0) {
                    // ✅ 사용자가 존재하면 해당 데이터 저장
                    obj = { username: results[0] };
                } else {
                    // ❌ DB에 해당 username이 없는 경우
                    obj = { username: false };
                }
                resolve(); // ✅ Promise 완료
            });
        } else {
            // ❌ 세션에 username이 없는 경우
            obj = { username: false };
            resolve(); // ✅ 바로 Promise 완료
        }
    });

    return obj; // ✅ Promise가 완료된 후 obj 반환
};