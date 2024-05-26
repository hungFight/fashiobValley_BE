import { typeChats } from '../schemas/chatsShema';
import { typeWarningData } from '../schemas/warningData';

const typeDefs = `#graphql
    scalar JSON
    type Chats${typeChats}
    type WarningData${typeWarningData}
    type Query{
        warningData(id: String!): WarningData
        chats(id_room: String,limit: Int,offset: Int): [Chats]
    }
`;
export default typeDefs;
