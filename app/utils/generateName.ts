import { NAME_1, NAME_2 } from './constants';

const capFirst = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min;
};

export const generateName = (): string => {
  const name1 = capFirst(NAME_1[getRandomInt(0, NAME_1.length)]);
  const name2 = capFirst(NAME_2[getRandomInt(0, NAME_2.length)]);

  return `${name1}-${name2}`;
};
