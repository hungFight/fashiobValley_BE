// import { RoomChats } from '../../models/mongodb/chats';
import express from 'express';

const resolvers = {
    Query: {
        chats: async (_: any, args: { id_room: any; limit: any; offset: any }, context: { req: express.Request; res: express.Response }) => {
            const { id_room, limit, offset } = args;
            const { req, res } = context;
            // const id = req.cookies.k_user;
        },
        warningData: async (_: any, args: { id: string }, context: { req: express.Request; res: express.Response | any }) => {
            const { req, res } = context;
            // const userId = req.cookies.k_user;
        },
    },
};
export default resolvers;
