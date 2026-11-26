import { CategoryIcon } from '@/app/groups/[groupId]/expenses/category-icon'
import { Button, ButtonProps } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { Category } from '@/generated/prisma/browser'
import { useMediaQuery } from '@/lib/hooks'
import { CUSTOM_CATEGORY_NAME_MAX_LENGTH, getCategoryName } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { forwardRef, useEffect, useState } from 'react'

type Props = {
  /** Group a category created from the search field is added to. */
  groupId: string
  categories: Category[]
  onValueChange: (categoryId: Category['id']) => void
  /** Category ID to be selected by default. Overwriting this value will update current selection, too. */
  defaultValue: Category['id']
  isLoading: boolean
}

export function CategorySelector({
  groupId,
  categories,
  onValueChange,
  defaultValue,
  isLoading,
}: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<number>(defaultValue)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // allow overwriting currently selected category from outside
  useEffect(() => {
    setValue(defaultValue)
    onValueChange(defaultValue)
  }, [defaultValue])

  const selectedCategory =
    categories.find((category) => category.id === value) ?? categories[0]

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <CategoryButton
            category={selectedCategory}
            open={open}
            isLoading={isLoading}
          />
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <CategoryCommand
            groupId={groupId}
            categories={categories}
            onValueChange={(id) => {
              setValue(id)
              onValueChange(id)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <CategoryButton
          category={selectedCategory}
          open={open}
          isLoading={isLoading}
        />
      </DrawerTrigger>
      <DrawerContent className="p-0">
        <CategoryCommand
          groupId={groupId}
          categories={categories}
          onValueChange={(id) => {
            setValue(id)
            onValueChange(id)
            setOpen(false)
          }}
        />
      </DrawerContent>
    </Drawer>
  )
}

function CategoryCommand({
  groupId,
  categories,
  onValueChange,
}: {
  groupId: string
  categories: Category[]
  onValueChange: (categoryId: Category['id']) => void
}) {
  const t = useTranslations('Categories')
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { mutateAsync: createCategory, isPending: isCreating } =
    trpc.categories.create.useMutation()
  const [search, setSearch] = useState('')

  const categoriesByGroup = categories.reduce<Record<string, Category[]>>(
    (acc, category) => ({
      ...acc,
      [category.grouping]: [...(acc[category.grouping] ?? []), category],
    }),
    {},
  )

  // Offer to create a category from the search text, unless one already has
  // that name.
  const newCategoryName = search.trim()
  const canCreate =
    newCategoryName !== '' &&
    !categories.some(
      (category) =>
        getCategoryName(category, t).toLocaleLowerCase() ===
        newCategoryName.toLocaleLowerCase(),
    )

  async function handleCreate() {
    if (isCreating) return
    try {
      const { category } = await createCategory({
        groupId,
        name: newCategoryName,
      })
      // Add it to the cached list right away so the selector can show it as
      // selected without waiting for a refetch.
      utils.categories.list.setData({ groupId }, (data) =>
        data && !data.categories.some(({ id }) => id === category.id)
          ? { categories: [...data.categories, category] }
          : data,
      )
      setSearch('')
      onValueChange(category.id)
    } catch {
      toast({
        title: t('CreateErrorToast.title'),
        description: t('CreateErrorToast.description'),
        variant: 'destructive',
      })
    }
  }

  return (
    <Command>
      <CommandInput
        placeholder={t('search')}
        className="text-base"
        value={search}
        onValueChange={setSearch}
        maxLength={CUSTOM_CATEGORY_NAME_MAX_LENGTH}
      />
      <CommandList>
        {!canCreate && <CommandEmpty>{t('noCategory')}</CommandEmpty>}
        {canCreate && (
          <CommandGroup forceMount>
            <CommandItem
              forceMount
              value={`create ${newCategoryName}`}
              disabled={isCreating}
              onSelect={handleCreate}
            >
              <div className="flex items-center gap-3">
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {t('create', { name: newCategoryName })}
              </div>
            </CommandItem>
          </CommandGroup>
        )}
        {Object.entries(categoriesByGroup).map(
          ([group, groupCategories], index) => (
            <CommandGroup key={index} heading={t(`${group}.heading`)}>
              {groupCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`${category.id} ${t(
                    `${category.grouping}.heading`,
                  )} ${getCategoryName(category, t)}`}
                  onSelect={(currentValue) => {
                    const id = Number(currentValue.split(' ')[0])
                    onValueChange(id)
                  }}
                >
                  <CategoryLabel category={category} />
                </CommandItem>
              ))}
            </CommandGroup>
          ),
        )}
      </CommandList>
    </Command>
  )
}

type CategoryButtonProps = {
  category: Category
  open: boolean
  isLoading: boolean
}
const CategoryButton = forwardRef<HTMLButtonElement, CategoryButtonProps>(
  (
    { category, open, isLoading, ...props }: ButtonProps & CategoryButtonProps,
    ref,
  ) => {
    const iconClassName = 'ml-2 h-4 w-4 shrink-0 opacity-50'
    return (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="flex w-full justify-between"
        ref={ref}
        {...props}
      >
        <CategoryLabel category={category} />
        {isLoading ? (
          <Loader2 className={`animate-spin ${iconClassName}`} />
        ) : (
          <ChevronDown className={iconClassName} />
        )}
      </Button>
    )
  },
)
CategoryButton.displayName = 'CategoryButton'

function CategoryLabel({ category }: { category: Category }) {
  const t = useTranslations('Categories')
  return (
    <div className="flex items-center gap-3">
      <CategoryIcon category={category} className="w-4 h-4" />
      {getCategoryName(category, t)}
    </div>
  )
}
