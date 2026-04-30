import { type FC } from "react";

export const PrivacyPage: FC = () => {
  return (
    <div className="privacy-page min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-500 mb-8">최종 수정일: 2026년 4월 30일</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">1. 수집하는 개인정보 항목</h2>
        <p className="text-gray-600 leading-relaxed">
          love6202는 서비스 제공을 위해 다음의 개인정보를 수집합니다.
        </p>
        <ul className="mt-3 space-y-1 text-gray-600 list-disc list-inside">
          <li>Google 소셜 로그인을 통해 제공되는 이름, 이메일 주소, 프로필 사진</li>
          <li>웨딩 초대장 작성 시 입력하는 결혼식 정보 (날짜, 장소, 인사말 등)</li>
          <li>방명록 작성 시 입력하는 이름 및 메시지</li>
          <li>서비스 이용 과정에서 자동 수집되는 접속 로그, IP 주소</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
        <ul className="space-y-1 text-gray-600 list-disc list-inside">
          <li>회원 가입 및 서비스 이용자 식별</li>
          <li>웨딩 초대장 생성, 수정 및 공유 서비스 제공</li>
          <li>방명록 및 참석 여부(RSVP) 기능 제공</li>
          <li>서비스 이용 관련 공지사항 전달</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
        <p className="text-gray-600 leading-relaxed">
          회원 탈퇴 시 지체 없이 개인정보를 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우
          해당 기간 동안 보관 후 파기합니다. 탈퇴 요청 후 30일 이내 복구가 가능하며, 이후 영구
          삭제됩니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">4. 개인정보의 제3자 제공</h2>
        <p className="text-gray-600 leading-relaxed">
          love6202는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의
          경우에는 예외로 합니다.
        </p>
        <ul className="mt-3 space-y-1 text-gray-600 list-disc list-inside">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차에 따라 요청이 있는 경우</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">5. 개인정보 처리 위탁</h2>
        <p className="text-gray-600 leading-relaxed">
          서비스 운영을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.
        </p>
        <ul className="mt-3 space-y-1 text-gray-600 list-disc list-inside">
          <li>Amazon Web Services (AWS): 서버 인프라 및 파일 저장소 운영</li>
          <li>Google LLC: 소셜 로그인(OAuth2) 서비스 제공</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">6. 이용자의 권리</h2>
        <p className="text-gray-600 leading-relaxed">
          이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며 개인정보 처리에 대한
          동의를 철회할 수 있습니다. 회원 탈퇴는 서비스 내 '마이페이지 → 회원 탈퇴' 메뉴를 통해
          직접 처리하실 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">7. 쿠키의 사용</h2>
        <p className="text-gray-600 leading-relaxed">
          love6202는 로그인 세션 유지를 위해 HTTP-Only 쿠키를 사용합니다. 이 쿠키는 JavaScript로
          접근할 수 없으며 보안 전송(HTTPS)에서만 전달됩니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">8. 개인정보 보호책임자</h2>
        <p className="text-gray-600 leading-relaxed">
          개인정보 관련 문의사항은 아래 연락처로 문의해 주시기 바랍니다.
        </p>
        <p className="mt-2 text-gray-600">
          이메일: <a href="mailto:2soaeng@gmail.com" className="text-primary underline">2soaeng@gmail.com</a>
        </p>
      </section>
    </div>
  );
};
