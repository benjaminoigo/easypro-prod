import { ValueTransformer } from 'typeorm';

export const numericTransformer: ValueTransformer = {
  to: (value: number | string | null | undefined) => value,
  from: (value: string | null | undefined) => {
    if (value === null || value === undefined) {
      return value;
    }
    return Number(value);
  },
};
