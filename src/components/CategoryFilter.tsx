"use client";

import {
  MainCategory,
  SubCategory,
  AllocationSubCategory,
  ManagementSubCategory,
  CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
} from "@/types/paper";

interface CategoryFilterProps {
  activeCategory: MainCategory | "all";
  activeSubCategory: SubCategory | "all";
  onCategoryChange: (cat: MainCategory | "all") => void;
  onSubCategoryChange: (sub: SubCategory | "all") => void;
}

const categories: (MainCategory | "all")[] = [
  "all",
  "asset-allocation",
  "asset-management",
  "risk-management",
  "performance-evaluation",
];

const allocationSubCategories: (AllocationSubCategory | "all")[] = [
  "all",
  "saa",
  "taa",
  "tpa",
  "strategy-general",
];

const managementSubCategories: (ManagementSubCategory | "all")[] = [
  "all",
  "equity",
  "bond",
  "alternative",
];

export function CategoryFilter({
  activeCategory,
  activeSubCategory,
  onCategoryChange,
  onSubCategoryChange,
}: CategoryFilterProps) {
  const subCategories =
    activeCategory === "asset-allocation"
      ? allocationSubCategories
      : activeCategory === "asset-management"
        ? managementSubCategories
        : null;

  const subTitle =
    activeCategory === "asset-allocation"
      ? "운용전략 하위 분류"
      : "자산운용 하위 분류";

  return (
    <div className="border-b border-slate-800 p-3 space-y-3 sm:p-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          주제 분류
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`min-h-9 rounded-lg px-2.5 py-2 text-xs font-medium transition sm:py-1.5 ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {cat === "all" ? "전체" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {subCategories && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {subTitle}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subCategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => onSubCategoryChange(sub)}
                className={`min-h-9 rounded-lg px-2.5 py-2 text-xs font-medium transition sm:py-1.5 ${
                  activeSubCategory === sub
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-transparent"
                }`}
              >
                {sub === "all"
                  ? "전체"
                  : SUB_CATEGORY_LABELS[sub as SubCategory]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
