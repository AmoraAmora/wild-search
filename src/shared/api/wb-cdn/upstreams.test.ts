import { describe, expect, it } from 'vitest';
import * as z from 'zod/mini';

import { upstreamsResponseSchema } from './upstreams';

// Trimmed real response of https://cdn.wbbasket.ru/api/v3/upstreams.
const RESPONSE = {
  recommend: {
    mediabasket_route_map: [{ method: 'mod', hosts: [{ host: 'mow-basket-cdn-02.geobasket.ru' }] }],
  },
  origin: {
    mediabasket_route_map: [
      {
        method: 'range',
        hosts: [
          { vol_range_from: 0, vol_range_to: 143, host: 'basket-01.wbbasket.ru' },
          { vol_range_from: 5814, vol_range_to: 6125, host: 'basket-30.wbbasket.ru' },
        ],
      },
    ],
    videonme_route_map: [
      {
        method: 'range',
        hosts: [{ vol_range_from: 108, vol_range_to: 119, host: 'videonme-basket-10.wbbasket.ru' }],
      },
    ],
    feedback_uuid_route_map: [{ method: 'uuid', hosts: [] }],
  },
  metrics_url: '',
};

describe('upstreamsResponseSchema', () => {
  it('extracts media and video host ranges, ignoring unrelated maps', () => {
    expect(upstreamsResponseSchema.parse(RESPONSE)).toEqual({
      media: [
        { from: 0, to: 143, host: 'basket-01.wbbasket.ru' },
        { from: 5814, to: 6125, host: 'basket-30.wbbasket.ru' },
      ],
      video: [{ from: 108, to: 119, host: 'videonme-basket-10.wbbasket.ru' }],
    });
  });

  it('fails loudly when WB changes the routing method', () => {
    const changed = {
      origin: {
        ...RESPONSE.origin,
        mediabasket_route_map: [{ method: 'mod', hosts: [{ host: 'basket-01.wbbasket.ru' }] }],
      },
    };

    expect(() => upstreamsResponseSchema.parse(changed)).toThrow(z.core.$ZodError);
  });

  it('rejects a response without the required route maps', () => {
    expect(() => upstreamsResponseSchema.parse({ origin: {} })).toThrow(z.core.$ZodError);
    expect(() => upstreamsResponseSchema.parse(null)).toThrow(z.core.$ZodError);
  });
});
