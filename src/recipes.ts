import { TeaType, TeaRecipe } from './types';

export const RECIPES: Record<TeaType, TeaRecipe> = {
  earl_grey: {
    name: 'Earl Grey',
    steepTime: 3,
    milk: false,
    sugar: 'optional'
  },
  english: {
    name: 'English Breakfast',
    steepTime: 4,
    milk: true,
    sugar: 'optional'
  },
  peppermint: {
    name: 'Peppermint',
    steepTime: 2,
    milk: false,
    sugar: 'none'
  },
  chai: {
    name: 'Chai',
    steepTime: 5,
    milk: true,
    sugar: 'required'
  }
};

export const TEA_TYPES: TeaType[] = ['earl_grey', 'english', 'peppermint', 'chai'];
