import { buildSchema } from 'graphql';

export const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }

  type Query {
    user(id: ID!): User
    users(limit: Int, offset: Int): [User!]!
  }

  schema {
    query: Query
  }
`;

export const schema = buildSchema(typeDefs);