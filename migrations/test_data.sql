-- ArmorClaw 测试数据脚本
-- 用于测试审计历史功能

-- 注意：运行此脚本前，请先登录一次以创建用户记录
-- 然后将下面的 'YOUR_GITHUB_ID' 替换为你的实际 GitHub ID

-- 插入测试审计记录
INSERT INTO audits (id, user_id, skill_name, skill_hash, status, ebpf_log_json, score, created_at)
SELECT 
  'test-audit-1',
  id,
  'ebpf-sensor-v1',
  'abc123def456',
  'passed',
  '{"checks": ["memory_safety", "race_conditions"], "warnings": 0}',
  95,
  datetime('now', '-5 minutes')
FROM users WHERE github_id = 'YOUR_GITHUB_ID';

INSERT INTO audits (id, user_id, skill_name, skill_hash, status, ebpf_log_json, score, created_at)
SELECT 
  'test-audit-2',
  id,
  'auth-middleware',
  'def456ghi789',
  'passed',
  '{"checks": ["input_validation", "sql_injection"], "warnings": 1}',
  88,
  datetime('now', '-2 hours')
FROM users WHERE github_id = 'YOUR_GITHUB_ID';

INSERT INTO audits (id, user_id, skill_name, skill_hash, status, ebpf_log_json, score, created_at)
SELECT 
  'test-audit-3',
  id,
  'database-proxy',
  'ghi789jkl012',
  'failed',
  '{"checks": ["buffer_overflow", "memory_leak"], "warnings": 5}',
  42,
  datetime('now', '-1 day')
FROM users WHERE github_id = 'YOUR_GITHUB_ID';

INSERT INTO audits (id, user_id, skill_name, skill_hash, status, ebpf_log_json, score, created_at)
SELECT 
  'test-audit-4',
  id,
  'kernel-hook-test',
  'jkl012mno345',
  'pending',
  '{"checks": [], "warnings": 0}',
  NULL,
  datetime('now', '-10 minutes')
FROM users WHERE github_id = 'YOUR_GITHUB_ID';

INSERT INTO audits (id, user_id, skill_name, skill_hash, status, ebpf_log_json, score, created_at)
SELECT 
  'test-audit-5',
  id,
  'network-filter',
  'mno345pqr678',
  'running',
  '{"checks": ["packet_validation"], "warnings": 0}',
  NULL,
  datetime('now', '-30 seconds')
FROM users WHERE github_id = 'YOUR_GITHUB_ID';

-- 查询验证
SELECT 
  skill_name,
  status,
  score,
  created_at
FROM audits
WHERE user_id IN (SELECT id FROM users WHERE github_id = 'YOUR_GITHUB_ID')
ORDER BY created_at DESC;
