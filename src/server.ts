import cors from '@fastify/cors';
import Fastify from 'fastify';
import { appRoutes } from './routes';

const app = Fastify()

app.register(cors, {
  origin: ['http://localhost:3000']
})
app.register(appRoutes)


app.listen({ port: 3333 }).then(() => { console.log('HTTP Server is running!') })