# Rewrites that buy nothing

Three pieces of common performance advice that are wrong. Read before proposing or accepting one
of these rewrites; each is a readability cost with no measured gain behind it.

**Moving an `INNER JOIN` filter from `WHERE` into `ON` is not an optimization.** For an inner join
the optimizer produces the same plan either way. Put join conditions in `ON` and filters in
`WHERE`, where a reader looks for them. (For an `OUTER JOIN` the two placements return different
rows — a correctness choice, not a speed one.)

**`DISTINCT` → `GROUP BY` is not an optimization.** They deduplicate identically. The real
smell is a `DISTINCT` that exists to hide a join producing rows you did not want — fix the
join, or accept the `DISTINCT` as intentional. Swapping the keyword changes nothing.

**`OR` → `UNION` needs `UNION`, not `UNION ALL`.** The rewrite only holds when the branches
are mutually exclusive; when a row can satisfy both, `UNION ALL` duplicates it, and plain
`UNION` adds a sort that often eats the gain. Prove exclusivity or leave the `OR` alone.
