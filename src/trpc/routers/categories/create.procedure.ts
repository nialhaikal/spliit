import { createCategory } from '@/lib/api'
import { CUSTOM_CATEGORY_NAME_MAX_LENGTH } from '@/lib/utils'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const createCategoryProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      name: z.string().trim().min(1).max(CUSTOM_CATEGORY_NAME_MAX_LENGTH),
    }),
  )
  .mutation(async ({ input: { groupId, name } }) => {
    return { category: await createCategory(groupId, name) }
  })
