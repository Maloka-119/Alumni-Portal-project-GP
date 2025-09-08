const express=require('express');
const router=express.Router();
const graduateController= require('../controllers/graduates.controller');

router.route('/:id')
        .get('/digital-id',graduateController.getDigitalID)
        .get('/profile',graduateController.getGraduateProfile)



module.exports = router; 