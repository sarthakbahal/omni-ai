import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express(); // Initialize express app

app.use(cors()); // Enable CORS for all routes , cors is like a middleware that allows cross-origin requests
//this is useful when your frontend and backend are on different domains or ports

app.use(express.json());  // this is used to parse incoming JSON requests and make the data available in req.body  

app.get('/', (req,res) => res.send('Server is running')) // the parameters are the route and the calback funtion that will be executed when the route is hit, here the route is home route

const PORT = process.env.PORT || 3000; // Set the port to the value from environment variables or default to 3000

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); // Start the server and listen on the specified port