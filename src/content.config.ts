import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const status = z.enum(["draft", "source-checked", "reviewed"]);
const passageIds = z.array(z.string().min(1));

export const collections = {
  reviews: defineCollection({ loader: glob({ pattern: "*.md", base: "./research/reviews" }) }),
  topics: defineCollection({
    loader: glob({ pattern: "*.md", base: "./research/topics" }),
    schema: z.object({
      title: z.string(),
      summary: z.string(),
      status,
      passages: passageIds
    })
  }),
  comparisons: defineCollection({
    loader: glob({ pattern: "*.md", base: "./research/comparisons" }),
    schema: z.object({
      title: z.string(),
      summary: z.string(),
      status,
      jesus: passageIds,
      paul: passageIds,
      context: passageIds.optional(),
      sourceIds: passageIds.optional(),
      reviewIds: passageIds.optional(),
      classification: z.enum([
        "agreement",
        "different-emphasis",
        "extension",
        "apparent-tension",
        "direct-contradiction",
        "insufficient-evidence"
      ])
    })
  }),
  issues: defineCollection({
    loader: glob({ pattern: "*.md", base: "./research/modern-issues" }),
    schema: z.object({
      title: z.string(),
      summary: z.string(),
      status,
      topicRefs: z.array(z.string().min(1)),
      sourceIds: passageIds.optional()
    })
  })
};
