-- 00019_insert_modifiers.sql
-- Insert modifier groups and options for POS menu items

WITH inserted_groups AS (
  INSERT INTO modifier_groups (
      company_id, name_th, name_en, min_selection, max_selection, created_at, updated_at
  )
  VALUES
    ((SELECT id FROM companies LIMIT 1),
      'เลือกเนื้อสัตว์หลัก',
      'Choose Main Protein', 1, 1, now(), now()),
    ((SELECT id FROM companies LIMIT 1),
      'ระดับความเผ็ด',
      'Spiciness Level', 1, 1, now(), now())
  RETURNING id, name_th
),

inserted_options AS (
  INSERT INTO modifier_options (
      modifier_group_id, name_th, name_en, price_cents, created_at, updated_at
  )
  SELECT
      (SELECT id FROM inserted_groups WHERE name_th = 'เลือกเนื้อสัตว์หลัก'),
      v.name_th, v.name_en, v.price_cents, now(), now()
  FROM (VALUES
        ('ไก่',   'Chicken', 0),
        ('หมู',   'Pork',    1500),
        ('เนื้อ', 'Beef',    3500)
       ) AS v(name_th, name_en, price_cents)
  UNION ALL
  SELECT
      (SELECT id FROM inserted_groups WHERE name_th = 'ระดับความเผ็ด'),
      v.name_th, v.name_en, v.price_cents, now(), now()
  FROM (VALUES
        ('ไม่เผ็ดเลย', 'Non-Spicy', 0),
        ('เผ็ดน้อย',   'Mild',      0),
        ('เผ็ดกลาง',   'Medium',    0),
        ('เผ็ดมาก',    'Fiery Hot', 0)
       ) AS v(name_th, name_en, price_cents)
  RETURNING id
),

link_groups AS (
  INSERT INTO menu_item_modifier_groups (
      menu_item_id, modifier_group_id
  )
  SELECT mi.id, g.id
  FROM menu_items mi
  CROSS JOIN inserted_groups g
  WHERE mi.is_active = true
  RETURNING *
)

SELECT
    (SELECT COUNT(*) FROM inserted_groups)  AS groups_inserted,
    (SELECT COUNT(*) FROM inserted_options) AS options_inserted,
    (SELECT COUNT(*) FROM link_groups)      AS links_created;
