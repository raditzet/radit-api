const nodemailer = require('nodemailer')
const path = require('path')
const Handlebars = require('handlebars')
const pdf = require('html-pdf')
const fs = require('fs')

const parentPath = path.join(__dirname, '../..')
const fileDir = path.join(parentPath, '/src/uploads') // tempat file (foto, html, pdf)

const transporter = nodemailer.createTransport({
    service:'gmail',
    auth: {
        type: 'OAuth2',
        user: 'donny.pranata3@gmail.com',
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    }
})

const createPdf = (user_id, user_firstname,user_lastname, user_email,user_address,user_city,user_country,user_phone, fnSendEmail) => {
    var source = `
<!DOCTYPE html>

<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
</head>

<body>
    <div class="container">
        <p class="display-4 d-flex justify-content-between border-bottom">
            <span class="text-left">Invoice</span>
            <span class="text-right">#{{invoice}}</span>
        </p>
        <img src={{imgSrc}} alt="">
        <h1>Account Details</h1>
        <p>
            Username    : {{user_id}} <br>
            Firstname   : {{user_firstname}} <br>
            Lastname    : {{user_lastname}} <br>
            Email       : {{user_email}} <br>
            Address     : {{user_address}} <br>
            City        : {{user_city}} <br>
            Country     : {{user_country}} <br>
            Phone       : {{user_phone}} <br>
            Plan        : <strong>Free</strong>
        </p>
    </div>
</body>

</html>
`

var data = {
    "imgSrc" : "http://icons.iconarchive.com/icons/iconka/meow/256/cat-clean-icon.png",
    "user_id" : `${user_id}`,
    "user_firstname" : `${user_firstname}`,
    "user_lastname":`${user_lastname}`,
    "user_email" : `${user_email}`,
    "user_address" : `${user_address}`,
    "user_city" : `${user_city}`,
    "user_country" : `${user_country}`,
    "user_phone" : `${user_phone}`
}

var template = Handlebars.compile(source) // compile teks html
var result = template(data) // gabungkan object data dg template html

fs.writeFileSync(`${fileDir}/result.html`, result) // path, template

var htmls = fs.readFileSync(`${fileDir}/result.html`, 'utf8')

var options = {format: 'Letter'}

pdf.create(htmls, options).toFile(`${fileDir}/result.pdf`, (err, result) => {
    if (err) return console.log(err.message);
    
    fnSendEmail()
    console.log("PDF berhasil dibuat");
    
})
}

const sendVerify = (user_id, user_firstname,user_lastname,user_email,user_address,user_city,user_country, user_phone) => {

    const transEmail = () =>{
        const mail = {
            from : 'Donny Pranata <donny.pranata3@gmail.com>',
            to: user_email,
            subject: 'Verifikasi Email',
            html: `<p>Hello ${user_firstname} ${user_lastname}, please click the link for verify your email</p>
            <a href='http://localhost:2019/verify?username=${user_id}'><h1>Verifikasi Email</h1></a>
            `,
            attachments: [{
                filename : `invoice.pdf`,
                path : `${fileDir}/result.pdf`,
                contentType: 'application/pdf'
            }]
        }
        transporter.sendMail(mail, (err, res) => {
            if(err) return console.log(err.message);
        
            console.log("Email berhasil terkirim");
            
            
        })
    }
    
    createPdf(user_id, user_firstname ,user_lastname, user_email,user_address,user_city,user_country,user_phone, transEmail)
    
}

module.exports = sendVerify