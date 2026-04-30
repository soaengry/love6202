import { type FC } from "react";

export const TermsPage: FC = () => {
  return (
    <div className="terms-page min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
      <p className="text-sm text-gray-500 mb-8">최종 수정일: 2026년 4월 30일</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제1조 (목적)</h2>
        <p className="text-gray-600 leading-relaxed">
          본 약관은 love6202(이하 "서비스")가 제공하는 웨딩 초대장 서비스의 이용과 관련하여
          서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제2조 (서비스의 제공)</h2>
        <p className="text-gray-600 leading-relaxed">서비스는 다음의 기능을 제공합니다.</p>
        <ul className="mt-3 space-y-1 text-gray-600 list-disc list-inside">
          <li>웨딩 초대장 생성 및 공유</li>
          <li>갤러리 사진 업로드 및 관리</li>
          <li>하객 참석 여부(RSVP) 수집</li>
          <li>방명록 작성 및 조회</li>
          <li>계좌번호 등 축의금 안내 등록</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제3조 (회원가입 및 이용)</h2>
        <p className="text-gray-600 leading-relaxed">
          서비스는 Google 소셜 로그인을 통해 가입할 수 있습니다. 이용자는 타인의 정보를 도용하거나
          허위 정보를 입력해서는 안 됩니다. 이를 위반할 경우 서비스 이용이 제한될 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제4조 (이용자의 의무)</h2>
        <p className="text-gray-600 leading-relaxed">이용자는 다음 행위를 하여서는 안 됩니다.</p>
        <ul className="mt-3 space-y-1 text-gray-600 list-disc list-inside">
          <li>타인의 개인정보를 무단으로 수집하거나 도용하는 행위</li>
          <li>서비스를 통해 음란, 폭력적 또는 불법적인 콘텐츠를 게시하는 행위</li>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>저작권 등 타인의 지식재산권을 침해하는 행위</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제5조 (서비스 이용 제한)</h2>
        <p className="text-gray-600 leading-relaxed">
          서비스는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해하는 경우 사전 통보
          없이 서비스 이용을 제한하거나 계정을 삭제할 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제6조 (콘텐츠의 소유권)</h2>
        <p className="text-gray-600 leading-relaxed">
          이용자가 서비스에 업로드한 사진, 텍스트 등 콘텐츠의 저작권은 이용자 본인에게 있습니다.
          다만, 서비스 내에서 콘텐츠를 표시하고 공유하기 위한 목적으로 서비스에 비독점적 이용
          권한을 부여합니다. 계정 삭제 또는 콘텐츠 삭제 시 해당 권한은 소멸됩니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제7조 (서비스 변경 및 중단)</h2>
        <p className="text-gray-600 leading-relaxed">
          서비스는 운영상, 기술상의 필요에 따라 서비스의 내용을 변경하거나 중단할 수 있습니다.
          서비스 중단 시 사전에 이용자에게 공지합니다. 단, 불가피한 경우 사후에 공지할 수 있습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제8조 (면책조항)</h2>
        <p className="text-gray-600 leading-relaxed">
          서비스는 이용자가 서비스를 통해 게시한 정보의 정확성 및 신뢰성에 대해 책임을 지지
          않습니다. 서비스는 천재지변, 네트워크 장애 등 불가항력적 사유로 인한 서비스 중단에 대해
          책임을 지지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제9조 (준거법 및 분쟁해결)</h2>
        <p className="text-gray-600 leading-relaxed">
          본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁은 대한민국 법원을
          관할 법원으로 합니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">제10조 (문의)</h2>
        <p className="text-gray-600 leading-relaxed">
          본 약관에 관한 문의사항은 아래 연락처로 보내주시기 바랍니다.
        </p>
        <p className="mt-2 text-gray-600">
          이메일: <a href="mailto:2soaeng@gmail.com" className="text-primary underline">2soaeng@gmail.com</a>
        </p>
      </section>
    </div>
  );
};
