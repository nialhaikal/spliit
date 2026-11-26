import { getCategories } from '@/lib/api'
import { groupProcedure } from '@/trpc/init'
import { z } from 'zod'

/**
 * The built-in categories plus the group's custom ones. Members only, since
 * custom category names are group data.
 */
export const listCategoriesProcedure = groupProcedure(
  z.object({ groupId: z.string().min(1) }),
).query(async ({ input: { groupId } }) => {
  return { categories: await getCategories(groupId) }
})
