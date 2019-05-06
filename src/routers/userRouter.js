const router = require('express').Router()
const bcrypt = require('bcryptjs')
const isEmail = require('validator/lib/isEmail')
const conn = require('../connections/connection')
const multer = require('multer')
const path = require('path') // Menentukan folder uploads
const fs = require('fs') // menghapus file gambar
const sendVerify = require('../emails/nodemailer') 

const uploadDir = path.join(__dirname + '/../uploads/' )

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

const upstore = multer ({
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

// CREATE NEW USER
router.post('/users', async (req, res) => { 
    var sql = `INSERT INTO td_users SET ?;` // Tanda tanya akan digantikan oleh variable data
    var sql2 = `SELECT * FROM td_users;`
    var data = req.body /* Object dari user 
            { user_id, 
              user_firstname, 
              user_lastname, 
              user_email,
              user_phone,
              user_password,
              user_type, set default as user
              user_address,
              user_zipcode,
              user_city,
              user_province,
              user_country
            }
    
    */
    // validasi untuk email
    if(!isEmail(req.body.user_email)) return res.send("Email is not valid")
    // ubah password yang masuk dalam bentuk hash
    req.body.user_password = await bcrypt.hash(req.body.user_password, 8)

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err.sqlMessage) // Error pada post data

        sendVerify(req.body.user_id, req.body.user_firstname, req.body.user_lastname, req.body.user_email, req.body.user_address, req.body.user_city, req.body.user_country, req.body.user_phone) // ketika user pertama kali dibuat

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err) // Error pada select data

            res.send(result)
        })
    })
})

// LOGIN USER
router.post('/users/login', (req, res) => { 
    const {user_id, user_password} = req.body

    const sql = `SELECT * FROM td_users WHERE user_id = '${user_id}'`

    conn.query(sql, async (err, result) => {
        if(err) return res.send(err.message) // Error pada query SQL

        const user = result[0] // Result berupa array of object

        if(!user) return res.send("User not found") // User tidak ditemukan

        if(!user.verified) return res.send("Please, verify your email") // Belum verifikasi email

        const hash = await bcrypt.compare(user_password, user.user_password) // true / false

        if(!hash) return res.send("Wrong password") // Password salah

        res.send(user) // Kirim object user
    })
})

// VERIFY USER
router.get('/verify', (req, res) => { 
    const user_id = req.query.username
    const sql = `UPDATE td_users SET verified = true WHERE user_id = '${user_id}'`
    const sql2 = `SELECT * FROM td_users WHERE user_id = '${user_id}'`

    conn.query(sql, (err, result) => {
        if(err) return res.send(err.sqlMessage)

        conn.query(sql2, (err, result) => {
            if(err) return res.send(err.sqlMessage)

            res.send('<h1>Verifikasi User anda telah berhasil</h1>')
        })
    })
})

// UPLOAD USER AVATAR
router.post('/upstore', upstore.single('avatar'), (req, res) => { 
    const sql = `SELECT * FROM td_users WHERE user_id = ?`
    const sql2 = `UPDATE td_users SET avatar = '${req.file.filename}' WHERE user_id = '${req.body.username}'`
    const data = req.body.username 

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err)

        conn.query(sql2, (err , result) => {
            if (err) return res.send(err)

            res.send({filename: req.file.filename})
        })
    })
})

// READ USER PROFILE
router.get('/users/username', (req, res) => { 
    const sql = `SELECT * FROM td_users WHERE user_id = ?`
    const data = req.query.uname

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err.message) // Error pada query SQL

        const user = result[0] // Result berupa array of object

        if(!user) return res.send("User not found") // User tidak ditemukan

        res.send({
            user,
            photo: `http://localhost:2019/upstore/${user.avatar}`
        })
        
    })

})

//EDIT/UPDATE USER
router.patch('/users/:userid', (req, res) => { 
    const sql = `UPDATE td_users SET ? WHERE id = ?`
    const data = [req.body, req.params.userid]

    conn.query(sql, data, (err, result) => {
        if (err) return res.send(err.mess)

        res.send(result)
    })
})

//DELETE USER AVATAR
router.delete('/upstore/delete', (req, res) => { 
    const sql = `SELECT avatar FROM td_users WHERE user_id = '${req.body.user_id}'` // Get avatar column from user
    const sql2 = `UPDATE td_users SET avatar = null WHERE user_id = '${req.body.user_id}'` // Set null on avatar column
    const sql3 = `SELECT * FROM td_users WHERE user_id = '${req.body.user_id}'` // Get updated user
    conn.query(sql, (err, result) => {
        if(err) return res.send(err)

        const avatar = result[0].avatar // Get avatar column

        const imgPath = uploadDir + avatar // File location
        
        fs.unlink(imgPath, err => { // Delete file avatar
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

// DELETE USER
router.delete('/users/delete', (req, res) => { 
    const sql = `DELETE FROM td_users WHERE user_id = ?`
    const data = req.body.user_id

    conn.query(sql, data, (err, result) => {
        if(err) return res.send(err)

        res.send(result)
    })
})

//ACCESS USER AVATAR
router.get('/upstore/:imgName', (req, res) => { 
    const options = {
        root: uploadDir
    }

    var fileName = req.params.imgName

    res.sendFile(fileName, options, (err) => {
        if(err) return console.log(err);
        
        console.log('Sent: ', fileName);
        
    })
})


module.exports = router