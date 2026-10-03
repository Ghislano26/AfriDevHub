import express from 'express'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import cors from 'cors'

const app = express()


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: "Trop de requete depuis cette adresse IP" }
});


//middleware
app.use(express.json())
app.use(morgan('combined'))
app.use(limiter)
app.use(cors)


//routing









export default app