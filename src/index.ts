import express from 'express';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import typeDefs from './models/GraphQL/typeDefs/typeDefs';
import resolvers from './models/GraphQL/resolvers/resolvers';
import { expressMiddleware } from '@apollo/server/express4';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT ?? 3001;
const httpServer = require('http').createServer(app);
const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
app.use(cookieParser(process.env.SECRET));
app.use(
    cors({
        credentials: true,
        origin: [`${process.env.REACT_URL}`],
    }),
);
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/', (req: any, res: any) => {
    res.send('Hello world!');
});
async function listen() {
    await server.start();
    app.use(
        expressMiddleware(server, {
            context: async ({ req, res }) => ({ req, res }),
        }),
    );
    await new Promise((resolve, reject) => httpServer.listen({ port }, resolve));
    console.log(`🚀 Server ready at http://localhost:${port}`);
}
listen();
