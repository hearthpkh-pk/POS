-- 1. สร้าง Enum Types สำหรับจำกัดค่า Status
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE discount_type AS ENUM ('AMOUNT', 'PERCENTAGE');
CREATE TYPE payment_method AS ENUM ('CASH', 'TRANSFER', 'CREDIT_CARD', 'PROMPT_PAY');
