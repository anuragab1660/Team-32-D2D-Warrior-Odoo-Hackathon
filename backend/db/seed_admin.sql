-- Update default admin password hash (bcrypt hash of 'Admin@1234' with cost 12)
UPDATE users
SET password_hash = '$2b$12$6aDcr8uc43b1Sk2wgXVlAOSsnSY1OipDXwmhO1nSwgRG9LVJ36R1y'
WHERE email = 'admin@company.com';
