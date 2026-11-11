import { auth, Role, ROLES } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export async function getServerSession(){
    try{
        const headersList = await headers()
        const session = await auth.api.getSession({
            headers: headersList
        })
        return session
    }catch(error){
        console.log(error);
        return null
    }
    
}

export async function requireAuth(){
    const session = await getServerSession()
    
    if(!session?.user){
        redirect('/signin?callbackUrl=/me/dashboard')
    }
    return session
}


export async function requireRole(allowedRoles: Role | Role[]) {
    const session = await requireAuth()
    
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    
    //Check session role first (no DB call)
    // const sessionRole = session.user.role as Role | undefined
    // if (sessionRole && roles.includes(sessionRole)) {
    //     return session 
    // }
    
    // Verify from DB only if session role missing/invalid
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!user || !roles.includes(user.role as Role)) {
        redirect('/unauthorized')
    }
    
    return { ...session, user: { ...session.user, role: user.role } }
}


export { ROLES }

// only need if you need conditional UI rendering.


// export async function hasRole(allowedRoles: Role | Role[]): Promise<boolean> {
//     const session = await getServerSession()
    
//     if (!session?.user) {
//         return false
//     }
    
//     const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    
//     // OPTIMIZATION: Check session role first
//     const sessionRole = session.user.role as Role | undefined
//     if (sessionRole && roles.includes(sessionRole)) {
//         return true // Fast path
//     }
    
//     // FALLBACK: DB lookup
//     const user = await prisma.user.findUnique({
//         where: { id: session.user.id },
//         select: { role: true }
//     })

//     return user ? roles.includes(user.role as Role) : false
// }
