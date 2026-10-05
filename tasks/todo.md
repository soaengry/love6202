# TODO

## 하객 사진 업로드 → S3 presigned URL 직접 업로드 전환
- [x] backend: s3.service — createPresignedPutUrl, headObject, uploadVariants 분리
- [x] backend: middleware/upload — isValidImageBuffer export, 하객 업로드용 multer 제거
- [x] backend: config/queue — imageProcessQueue 추가
- [x] backend: imageProcess.worker 신규 + server.ts 등록
- [x] backend: upload domain — constants/schema/error/service(presign·complete·delete)/router
- [x] backend: upload.service 단위 테스트
- [x] frontend: uploadApi — presign / putToS3 / complete
- [x] frontend: UploadForm — 직접 업로드 + 진행률
- [x] frontend: MyUploadList — 처리 중 플레이스홀더 + 폴링
- [x] 검증: tsc / test / lint
- [ ] (사용자) S3 버킷 CORS 설정
- [ ] 로컬/운영 E2E: 20장 업로드 → 썸네일 → Drive 동기화 → 삭제 확인 (CORS 설정 후)
