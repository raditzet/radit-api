const express = require('express')
const userRouter = require('./routers/userRouter')
const prodRouter = require('./routers/prodRouter')
const catgRouter = require('./routers/catgRouter')

const app = express()
const port = process.env.PORT //mengambil port yang ada di dev.env

app.get('/',(req,res)=>{
    res.send(`<h1>API Running on port ${port}</h1>`)
})

app.use(express.json())
app.use(userRouter)
app.use(prodRouter)
app.use(catgRouter)

app.listen(port, () => {
    console.log("Running at ", port);
})