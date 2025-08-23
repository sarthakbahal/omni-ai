import express from "express";
import {auth} from "../middlewares/auth.js"
import { getPublishedCreations, getUserCreations, toggleLikeCreation } from "../controllers/userController.js";

//this file is created to have api endpointes for user functions defined in the userController.js
const userRouter = express.Router();

userRouter.get('/get-user-creations',auth,getUserCreations)
userRouter.get('/get-published-creations',auth,getPublishedCreations)
userRouter.post('/toggle-like-creation',auth,toggleLikeCreation) //we add post method here because we have to send data in the request body

export default userRouter;