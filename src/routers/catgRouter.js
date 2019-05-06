const router = require('express').Router()
const conn = require('../connections/connection')

//ADD NEW CATEGORY
router.post('/categories',async (req,res)=>{
    var sql = `INSERT INTO td_category SET ?;`
    var sql2 = `SELECT * FROM td_category`
    var data = req.body

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err.sqlMessage) // Error pada post data

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err) // Error pada select data

            res.send(result)
        })
    })
})

//EDIT CATEGORY
router.patch('/categories/:catgid',(req,res)=>{
    const sql = `UPDATE td_category SET ? WHERE id = ?`
    const data = [req.body, req.params.catgid]

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err.mess)

        res.send(result)
    })
})

/**ONLY DISABLE THE CATEGORY STATUS INTO FALSE
 * NO DELETE CATEGORY FROM TABLE DIRECTLY
 */


module.exports = router