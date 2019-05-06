const router = require('express').Router()
const conn = require('../connections/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads
const fs = require('fs') // menghapus file gambar

const uploadDir = path.join(__dirname + '/../prodImgs/' )

const storagE = multer.diskStorage({
    // Destination
    destination : function(req, file, cb) {
        cb(null, uploadDir)
    },
    // Filename
    filename : function(req, file, cb) {
        cb(null, Date.now() + file.fieldname + path.extname(file.originalname))
    }
})

const prodstore = multer ({
    storage: storagE,
    limits: {
        fileSize: 10000000 // Byte
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ // will be error if the extension name is not one of these
            return cb(new Error('Please upload image file (jpg, jpeg, or png)')) 
        }
        cb(undefined, true)
    }
})

//ADD NEW PRODUCT
router.post('/products',async (req,res)=>{
    var sql = `INSERT INTO td_products SET ?;`
    // {prod_name,prod_desc,prod_price,prod_stock,prod_safety_stock,category_id}
    var sql2 = `SELECT * FROM td_products`
    var data = req.body

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err.sqlMessage) // Error pada post data

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err) // Error pada select data

            res.send(result)
        })
    })
})

//UPLOAD PRODUCT IMAGE
router.post('/prodstore', prodstore.single('prod_image'), (req, res) => { 
    const sql = `SELECT * FROM td_products WHERE id = ?`
    const sql2 = `UPDATE td_products SET prod_image = '${req.file.filename}' WHERE id = '${req.body.prodId}'`
    const data = req.body.prodId 

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err)

        conn.query(sql2, (err , result) => {
            if (err) return res.send(err)

            res.send({filename: req.file.filename})
        })
    })
})

//VIEW PRODUCT
router.get('/products/prodid', (req, res) => { 
    const sql = `SELECT * FROM td_products WHERE id = ?`
    const data = req.query.prodId

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err.message) // Error pada query SQL

        const product = result[0] // Result berupa array of object

        if(!product) return res.send("User not found") // Product tidak ditemukan

        res.send({
            product,
            photo: `http://localhost:2019/prodstore/${product.prod_image}`
        })
        
    })

})

//EDIT/UPDATE PRODUCT(NAME, STOCK, ETC)
router.patch('/products/:prodid', (req, res) => { 
    const sql = `UPDATE td_products SET ? WHERE id = ?`
    const data = [req.body, req.params.prodid]

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err.mess)

        res.send(result)
    })
})

//DELETE PRODUCT IMAGE
router.delete('/prodstore/delete', (req, res) => { 
    const sql = `SELECT prod_image FROM td_products WHERE id = '${req.body.id}'` // Get avatar column from user
    const sql2 = `UPDATE td_products SET prod_image = null WHERE id = '${req.body.id}'` // Set null on avatar column
    const sql3 = `SELECT * FROM td_products WHERE id = '${req.body.id}'` // Get updated user
    conn.query(sql, (err, result) => {
        if(err) return res.send(err)

        const prodImg = result[0].prod_image // Get prod_image column

        const imgPath = uploadDir + prodImg // File location
        
        fs.unlink(imgPath, err => { // Delete file prod_image
            if (err) return res.send(err)

            conn.query(sql2, (err, result) => {
                if (err) return res.send(err)

                conn.query(sql3, (err, result) => {
                    if (err) return res.send(err)
    
                    res.send(result)
                })
            })
            
        })
    })
})

module.exports = router