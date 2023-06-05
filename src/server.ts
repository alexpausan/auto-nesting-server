import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'

import { getResponsiveUI } from './services/getResponsiveUI'

const app: Express = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const port = 3000

app.post('/magic-layout', async (req: Request, res: Response) => {
  const response = await getResponsiveUI(req.body)

  res.json(response)
  // console.log('response', response)
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
