import { prisma } from "~/server/db"

const metadata = {
    async get(key: string) {
        const m = await prisma.globalMetadata.findUnique({
            where: {
                key: key
            }
        })
        return m?.value ?? null
    },
    async getAsInt(key: string) {
        const data = await this.get(key)
        return data ? parseInt(data) : null
    },
    set(key: string, value: string) {
        return prisma.globalMetadata.upsert({
            where: {
                key: key
            },
            update: {
                value: value
            },
            create: {
                key: key,
                value: value
            }
        })
    },
    setInt(key: string, value: number) {
        return this.set(key, value.toString())
    },
    removeKey(key: string) {
        return prisma.globalMetadata.delete({
            where: {
                key: key
            }
        })
    },
    clearAll() {
        return prisma.globalMetadata.deleteMany({})
    }
}

export default metadata