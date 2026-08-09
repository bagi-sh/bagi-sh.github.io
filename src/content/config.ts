import { defineCollection, z } from 'astro:content';

export const collections = {
  microblog: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string().optional(),
      pubDate: z.coerce.date(),
      tags: z.array(z.string()).optional(),
    }),
  }),
  docs: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      order: z.number().optional(),
    }),
  }),
};
