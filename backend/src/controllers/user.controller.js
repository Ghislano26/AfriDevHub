import bcrypt from 'bcrypt'
import prisma from '../lib/prisma.js'
import { generateAccessToken, generateRefreshToken } from '../lib/authToken.js'
import { httpCode } from '../static/httpCode.js'

const userController = {

    // inscription d'un utilisateur sur la plateforme
    signup  : async(req, res)=>{
        try {
            const { username, email, password, country, bio, avatarUrl, role} = req.body
            if (!username || !email || !password || !country) {
                return res.status(httpCode.BAD_REQUEST).json({message: 'Tous les champs sont requis'})
            }

            //on verifie si l'email qu'il entre existe deja en base de donnees avant de l'ajouter

            const userExit = await prisma.users.findUnique({where: {email}})
            if (userExit) {
                return res.status(httpCode.CONFLICT).json({message: 'Cette adresse mail est deja utilisée'})
            }

            const hashPassword = await bcrypt.hash(password, 10)

            const newUser = await prisma.users.create({
                data: {username, email, password : hashPassword, country, bio, avatarUrl, role:role}
            })

            return res.status(httpCode.OK).json({message: 'Utilisateur cree avec succes', newUser})

        } catch (error) {
            return res.status(httpCode.INTERNAL_SERVER_ERROR).json({message: error?.message})
        }
    },

    login : async(req, res)=>{
        try {
            const {email, password} = req.body
            if (!email || !password) {
                return res.status(httpCode.BAD_REQUEST).json({message: 'Tous les champs sont requis'})
            }
            // on recupere l'user en bd a partir de son mail
            const user = await prisma.users.findUnique({where: {email}})
            if (!user) {
                return res.status(httpCode.NOT_FOUND).json({message: "Ce compte n'existe pas"})
            }

            //s'il exite bien, alors on compare le mdp qui est en bd avec celui entre lors de la connexion
            const truePassword = await bcrypt.compare(password, user.password)
            if (!truePassword) {
                return res.status(httpCode.UNAUTHORIZED).json({message: "Mot de passe incorrect"})
            }

            //Si tout est bon, on lui genere un access et refresh token
            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)

            await prisma.users.update({
                where: {id: user.id},
                data: {refreshToken}
            })

            return res.status(httpCode.OK).json({
                message: 'Connexion reussie',
                accessToken,
                refreshToken,
                user: {id: user.id, email: user.email, role: user.role}
            })
            
        } catch (error) {
            return res.status(httpCode.INTERNAL_SERVER_ERROR).json({message: error?.message})
        }
    }


}


export default userController