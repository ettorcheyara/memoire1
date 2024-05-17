
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/utilisateur');

router.post('/utilisateurs', async (req, res) => {
    try {

        const { nom, email, role, motDePasse } = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(motDePasse, saltRounds);
        const nouvelUtilisateur = new Utilisateur({
            nom: nom,
            email: email,
            role: role,
            motDePasse: hashedPassword
        });
        const utilisateurSauvegarde = await nouvelUtilisateur.save();
        res.status(201).send(utilisateurSauvegarde);
    } catch (error) {

        res.status(400).send(error);
    }
});
router.get('/utilisateurs/tous', async (req, res) => {
    try {
        const utilisateurs = await Utilisateur.find({});
        res.status(200).send(utilisateurs);
    } catch (error) {
        res.status(500).send({ message: "Erreur serveur", error: error });
    }
});
router.delete('/utilisateurs', async (req, res) => {
    try {
        const result = await Utilisateur.deleteMany({});
        res.status(200).send({ message: "Tous les utilisateurs ont été supprimés", deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).send({ message: "Erreur serveur", error: error });
    }
});

router.get('/utilisateurs/recherche', async (req, res) => {
    try {
        const email = req.query.email;
        const utilisateur = await Utilisateur.findOne({ email: email });

        if (!utilisateur) {
            return res.status(404).send({ message: "Aucun utilisateur trouvé avec cet email" });
        }
        res.status(200).send(utilisateur);
    } catch (error) {
        res.status(500).send({ message: "Erreur serveur", error: error });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, motDePasse } = req.body;
        console.log(`Tentative de connexion pour l'email : ${email}`);
        const utilisateur = await Utilisateur.findOne({ email });
        console.log(utilisateur ? 'Utilisateur trouvé' : 'Utilisateur non trouvé');

        if (!utilisateur) {
            return res.status(400).send({ message: "Identifiants incorrects", ok: false });
        }
        const match = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
        console.log(match ? 'Mot de passe valide' : 'Mot de passe invalide');

        if (match) {
            const token = jwt.sign({ nom: utilisateur.nom, id: utilisateur._id, email: utilisateur.email, role: utilisateur.role }, 'your_secret_key', { expiresIn: '24h' });
            if (utilisateur.role === 'vendeur') {
                res.send({ redirect: '/', token: token, ok: true });
            } else if (utilisateur.role === 'client') {
                res.send({ redirect: '/', token: token, ok: true });
            } else if (utilisateur.role === 'admin') {
                res.send({ redirect: '/admin', token: token, ok: true });
            }

        } else {
            res.status(400).send({ message: "Identifiants incorrects", ok: false });
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
