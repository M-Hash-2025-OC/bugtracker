import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development, we use a global variable to preserve the client connection
  // across hot reloads, preventing multiple connections.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, we create a new client for each request to avoid issues with
  // a global state.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;