-- Reject reason: set by admin when rejecting an in_review route.
-- Shown to the author on their draft page so they know what to fix.
alter table route add column if not exists reject_reason text;
