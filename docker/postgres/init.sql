-- dev 데이터베이스 생성 (prod는 POSTGRES_DB 환경변수로 자동 생성)
SELECT 'CREATE DATABASE love6202_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'love6202_dev')\gexec
