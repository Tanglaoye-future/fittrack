import { Injectable } from '@nestjs/common';

export interface MacroSource {
  kcal_per_100g: number | string | { toNumber(): number };
  protein_per_100g: number | string | { toNumber(): number };
  carbs_per_100g: number | string | { toNumber(): number };
  fat_per_100g: number | string | { toNumber(): number };
}

export interface MacroResult {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Injectable()
export class MacroCalculatorService {
  calcFromGrams(food: MacroSource, grams: number | string): MacroResult {
    const g = Number(grams);
    return {
      kcal: (Number(food.kcal_per_100g) * g) / 100,
      protein: (Number(food.protein_per_100g) * g) / 100,
      carbs: (Number(food.carbs_per_100g) * g) / 100,
      fat: (Number(food.fat_per_100g) * g) / 100,
    };
  }

  sumMacros(items: MacroResult[]): MacroResult {
    return items.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }
}
