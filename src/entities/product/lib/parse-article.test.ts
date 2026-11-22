import { describe, expect, it } from 'vitest';

import { parseArticle } from './parse-article';

describe('parseArticle', () => {
  it.each([
    ['604174866', 604174866],
    ['  592995535 ', 592995535],
    ['https://www.wildberries.ru/catalog/604174866/detail.aspx', 604174866],
    ['https://www.wildberries.ru/catalog/604174866/detail.aspx?size=123&targetUrl=GP', 604174866],
    ['wildberries.ru/catalog/592995535', 592995535],
  ])('parses %j', (input, expected) => {
    expect(parseArticle(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    '0',
    '-5',
    '12.5',
    '60417abc',
    '1234567890123456',
    'https://www.wildberries.ru/brands/123',
    'https://www.wildberries.ru/catalog/zhenshchinam',
  ])('rejects %j', (input) => {
    expect(parseArticle(input)).toBeNull();
  });
});
