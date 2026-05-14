export interface CategoryWithChildren {
  id: number;
  name: string;
  parentId: number | null;
  parent?: CategoryWithChildren | null;
  children: CategoryWithChildren[];
  _count?: {
    products: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

// Для обычного списка категорий
export type CategoryListItem = Omit<CategoryWithChildren, "children"> & {
  children?: never;
};
