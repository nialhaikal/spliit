import { getCategories } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const listCategoriesProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }).optional())
  .query(async ({ input }) => {
    return { categories: await getCategories(input?.groupId) }
  })
