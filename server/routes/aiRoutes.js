import express from "express";
import { generateArticle } from "../controllers/aiController.js";
import {auth} from "../middlewares/auth.js";

const aiRouter = express.Router(); // here we create a new router instance

aiRouter.post('/generate-article',auth, generateArticle) // this is the post method for the route mentioned , auth is the middleware and generate article is the function handling the request

export default aiRouter;

//this is the ai router that serves as an api endpoint for the ai generation feature