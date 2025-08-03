import express from 'express'
import { Login, Logout, SigUp } from '../controllers/User.controller.js'
import { UserId } from '../middlewares/UserId.js'
import { getUser, isAuthenticated } from '../controllers/GetController.js'
const router=express.Router()
router.post('/sign-up',SigUp)
router.post('/login',Login)
router.get('/logout',Logout)
router.get('/is-auth',UserId,isAuthenticated)
router.get('/userData',UserId,getUser)
export default router