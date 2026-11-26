import { createTRPCRouter } from '@/trpc/init'
import { createCategoryProcedure } from '@/trpc/routers/categories/create.procedure'
import { listCategoriesProcedure } from '@/trpc/routers/categories/list.procedure'

export const categoriesRouter = createTRPCRouter({
  list: listCategoriesProcedure,
  create: createCategoryProcedure,
})
