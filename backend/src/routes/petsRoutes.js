import { Router } from 'express';
import { authRequired, allowRoles } from '../middlewares/auth.js';
import { createPet, deletePet, listMyPets, updatePet } from '../controllers/petsController.js';

const router = Router();
router.use(authRequired, allowRoles('customer'));
router.get('/my', listMyPets);
router.post('/', createPet);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);
export default router;
