import express from 'express'
import { Login, Logout, SigUp } from '../controllers/User.controller.js'
const router=express.Router()
router.post('/sign-up',SigUp)
router.post('/login',Login)
router.get('/logout',Logout)
export default router