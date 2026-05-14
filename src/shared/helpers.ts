import { Prisma } from "@prisma/client"

//type predicate
export function isUniqueContraintError(error:any):error is Prisma.PrismaClientKnownRequestError{
    return error  instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export function isNotFoundError(error:any):error is Prisma.PrismaClientKnownRequestError {
    return error  instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
}