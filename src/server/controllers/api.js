import express from 'express'
import manager from '../../lib/Manager.js'


var apiv1 = express.Router();

apiv1.get('/robots', function(req, res) {
  res.json({data:manager.robots});
});

apiv1.get('/users', function(req, res) {
  res.send('List of APIv1 users.');
});

export default apiv1;