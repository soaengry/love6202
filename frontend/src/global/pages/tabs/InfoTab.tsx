import { useState, useEffect, useCallback, useRef, type FC } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  IoCallOutline,
  IoCopyOutline,
  IoChevronDownOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import type {
  WeddingDetailResponse,
  AccountResponse,
  AccountSide,
} from "@/domain/wedding/types.ts";
import { ENV } from "@/global/config/env.ts";

interface InfoTabProps {
  data: WeddingDetailResponse;
}

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};


const AnimatedSection: FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.section
      ref={ref}
      variants={slideUp}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const Divider: FC = () => {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="w-16 h-px bg-primary/10" />
      <div className="w-1 h-1 rounded-full bg-primary/20" />
      <div className="w-16 h-px bg-primary/10" />
    </div>
  );
};

const SectionLabel: FC<{ text: string }> = ({ text }) => {
  return (
    <p className="text-[10px] tracking-[0.4em] text-primary/40 mb-8 uppercase font-medium text-center">
      {text}
    </p>
  );
};

// ─── Landing Section ───
const LandingSection: FC<InfoTabProps> = ({ data }) => {
  const { wedding, heroImages, couples } = data;
  const images = [...heroImages].sort((a, b) => a.orderIndex - b.orderIndex);
  const [current, setCurrent] = useState(0);

  const groom = couples.find((c) => c.role === "GROOM");
  const bride = couples.find((c) => c.role === "BRIDE");

  const next = useCallback(() => {
    if (images.length <= 1) return;
    setCurrent((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [images.length, next]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
    const hour = d.getHours();
    const minute = d.getMinutes();
    const ampm = hour < 12 ? "오전" : "오후";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const timePart = `${ampm} ${displayHour}시${minute > 0 ? ` ${minute}분` : ""}`;
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${DAYS[d.getDay()]}요일 ${timePart}`;
  };

  return (
    <section
      className="landing-section relative w-full overflow-hidden bg-bg-primary"
      style={{ minHeight: "85vh" }}
    >
      {images.length > 0 ? (
        <div className="relative w-full h-full" style={{ minHeight: "85vh" }}>
          {images.map((img, i) => {
            const isActive = i === current;
            return (
              <motion.div
                key={img.imageUrl}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {/* 활성화 시 key 교체 → Ken Burns 재시작. img 데이터는 브라우저 캐시 제공 */}
                <motion.img
                  key={isActive ? `active-${current}` : i}
                  src={img.imageUrl}
                  alt={`슬라이드 ${i + 1}`}
                  className="w-full h-full object-cover"
                  style={{ minHeight: "85vh" }}
                  initial={{ scale: 1.08 }}
                  animate={{ scale: 1.0 }}
                  transition={{ duration: 6, ease: "easeOut" }}
                />
              </motion.div>
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
        </div>
      ) : (
        <div
          className="hero-fallback w-full"
          style={{
            minHeight: "85vh",
            background:
              "linear-gradient(to bottom, var(--hero-fallback-from), var(--hero-fallback-to))",
          }}
        />
      )}

      {/* 부유하는 빛 입자 */}
      <div className="landing-particles absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className="landing-particle"
            style={
              {
                left: `${8 + ((i * 7.5) % 85)}%`,
                "--size": `${3 + (i % 4) * 2}px`,
                "--duration": `${6 + (i % 5) * 3}s`,
                "--delay": `${(i * 1.3) % 8}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-12 px-6 text-center text-white">
        {groom && bride && (
          <p className="text-lg tracking-[0.3em] font-light mb-3 drop-shadow-lg">
            {groom.name} <span className="text-white/60 mx-2">&</span>{" "}
            {bride.name}
          </p>
        )}
        <h1 className="text-2xl font-semibold mb-4 drop-shadow-lg leading-relaxed whitespace-pre-line">
          {wedding.title}
        </h1>
        <p className="text-sm tracking-[0.15em] text-white/80 drop-shadow">
          {formatDate(wedding.weddingDate)}
        </p>

        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === current ? "bg-white w-6" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Couple Section ───
// ─── Greeting Section ───
const GreetingSection: FC<{ greeting: string | null }> = ({ greeting }) => {
  if (!greeting) return null;
  return (
    <AnimatedSection className="greeting-section py-10 px-6">
      <SectionLabel text="Invitation" />
      <p className="greeting-text text-sm text-text-secondary text-center whitespace-pre-line leading-relaxed max-w-xs mx-auto">
        {greeting}
      </p>
    </AnimatedSection>
  );
};

// ─── Couple Section ───
const CoupleSection: FC<{
  couples: WeddingDetailResponse["couples"];
}> = ({ couples }) => {
  const groom = couples.find((c) => c.role === "GROOM");
  const bride = couples.find((c) => c.role === "BRIDE");

  if (!groom && !bride) return null;

  const renderParents = (couple: typeof groom) => {
    if (!couple) return null;
    const parts: string[] = [];
    if (couple.fatherName)
      parts.push(`${couple.isFatherAlive ? "" : "故 "}${couple.fatherName}`);
    if (couple.motherName)
      parts.push(`${couple.isMotherAlive ? "" : "故 "}${couple.motherName}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  const renderPerson = (couple: typeof groom, label: string) => {
    if (!couple) return null;
    return (
      <div className="flex flex-col items-center text-center">
        {couple.profileImageUrl ? (
          <img
            src={couple.profileImageUrl}
            alt={couple.name}
            className="couple-avatar w-24 h-24 rounded-full object-cover border-2 border-surface shadow-sm mb-3"
          />
        ) : (
          <div className="couple-avatar-placeholder w-24 h-24 rounded-full bg-bg-tertiary border-2 border-surface shadow-sm mb-3 flex items-center justify-center text-text-tertiary text-2xl">
            {couple.name.charAt(0)}
          </div>
        )}
        <div className="flex gap-3 items-center mb-1">
          <p className="text-xs text-primary/60">{label}</p>
          <p className="couple-name text-base font-semibold text-text-primary">
            {couple.name}
          </p>
        </div>
        {renderParents(couple) && (
          <p className="couple-parents text-xs text-text-tertiary mb-6">
            {renderParents(couple)}
          </p>
        )}
        {couple.contact && (
          <a
            href={`tel:${couple.contact}`}
            className="inline-flex items-center gap-2 text-xs text-primary hover:text-primary-dark transition-colors"
          >
            <IoCallOutline size={14} />
            연락하기
          </a>
        )}
      </div>
    );
  };

  return (
    <AnimatedSection className="host-info-section py-10 px-6">
      <SectionLabel text="Groom & Bride" />
      <div className="flex items-start justify-center gap-8">
        {renderPerson(groom, "신랑")}
        <span className="text-primary/30 text-xl mt-10 font-light">&</span>
        {renderPerson(bride, "신부")}
      </div>
    </AnimatedSection>
  );
};

// ─── Date & Venue Section ───
const DateVenueSection: FC<{ wedding: WeddingDetailResponse["wedding"] }> = ({
  wedding,
}) => {
  const d = new Date(wedding.weddingDate);
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DAYS[d.getDay()];
  const hour = d.getHours();
  const minute = d.getMinutes();
  const ampm = hour < 12 ? "오전" : "오후";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  // 미니 캘린더
  const firstDayOfMonth = new Date(year, d.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, d.getMonth() + 1, 0).getDate();
  const calendarDays: (number | null)[] = Array(firstDayOfMonth).fill(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  return (
    <AnimatedSection className="wedding-day-section py-10 px-6">
      <SectionLabel text="Wedding Day" />
      <div className="text-center mb-8">
        <p className="wedding-date text-2xl font-semibold text-text-primary">
          {year}년 {month}월 {day}일 {dow}요일
        </p>
        <p className="wedding-time text-sm text-text-secondary mt-1">
          {ampm} {displayHour}시{minute > 0 ? ` ${minute}분` : ""}
        </p>
      </div>

      {/* 미니 캘린더 */}
      <div className="max-w-xs mx-auto mb-8">
        <div className="grid grid-cols-7 text-center text-[11px] mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <span
              key={d}
              className={
                i === 0
                  ? "text-calendar-sunday"
                  : i === 6
                    ? "text-calendar-saturday"
                    : "text-text-tertiary"
              }
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center text-xs gap-y-1">
          {calendarDays.map((cd, i) => {
            const isWeddingDay = cd === day;
            const dayOfWeek = i % 7;
            return (
              <div
                key={i}
                className={`py-1 flex items-center justify-center ${isWeddingDay ? "relative" : ""}`}
              >
                {cd && (
                  <span
                    className={`
                    ${isWeddingDay ? "bg-primary text-white w-7 h-7 rounded-full inline-flex items-center justify-center font-semibold" : ""}
                    ${!isWeddingDay && dayOfWeek === 0 ? "text-calendar-sunday" : ""}
                    ${!isWeddingDay && dayOfWeek === 6 ? "text-calendar-saturday" : ""}
                    ${!isWeddingDay ? "text-text-primary" : ""}
                  `}
                  >
                    {cd}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
};

// ─── Location Section (Map) ───
const loadKakaoMapSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${ENV.KAKAO_MAP_KEY}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("카카오맵 로드 실패"));
    document.head.appendChild(script);
  });
};

const LocationSection: FC<{ wedding: WeddingDetailResponse["wedding"] }> = ({
  wedding,
}) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const mapRef = useRef<HTMLDivElement>(null);
  const hasMap = wedding.venueLat != null && wedding.venueLng != null;

  useEffect(() => {
    if (!hasMap || !mapRef.current || !ENV.KAKAO_MAP_KEY) return;
    let isMounted = true;
    loadKakaoMapSdk()
      .then(() => {
        if (!isMounted || !mapRef.current) return;
        const { kakao } = window;
        const position = new kakao.maps.LatLng(
          wedding.venueLat!,
          wedding.venueLng!,
        );
        const map = new kakao.maps.Map(mapRef.current, {
          center: position,
          level: 3,
        });
        new kakao.maps.Marker({ map, position });
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [hasMap, wedding.venueLat, wedding.venueLng]);

  if (!hasMap) return null;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wedding.venueAddress);
      toast.success("주소가 복사되었습니다");
    } catch {
      toast.error("주소 복사에 실패했습니다");
    }
  };

  const handleOpenKakaoMap = () => {
    const url = `https://map.kakao.com/link/map/${wedding.venueName},${wedding.venueLat},${wedding.venueLng}`;
    window.open(url, "_blank");
  };

  const handleOpenNavi = () => {
    const url = `https://map.kakao.com/link/to/${wedding.venueName},${wedding.venueLat},${wedding.venueLng}`;
    window.open(url, "_blank");
  };

  return (
    <motion.section
      ref={sectionRef}
      variants={slideUp}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="location-section py-10 px-6"
    >
      <SectionLabel text="Location" />

      {ENV.KAKAO_MAP_KEY && (
        <div
          ref={mapRef}
          className="map-container w-full h-60 rounded-2xl mb-4 bg-bg-tertiary shadow-inner"
        />
      )}

      <div className="flex gap-2 justify-center mb-8">
        <button
          onClick={handleOpenKakaoMap}
          className="flex-1 max-w-[120px] py-2.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors cursor-pointer"
        >
          카카오맵
        </button>
        <button
          onClick={handleOpenNavi}
          className="flex-1 max-w-[120px] py-2.5 rounded-xl bg-[#3B5998] text-white text-xs font-medium hover:opacity-90 transition-colors cursor-pointer"
        >
          길찾기
        </button>
        <button
          onClick={handleCopyAddress}
          className="copy-address-button flex-1 max-w-[120px] py-2.5 rounded-xl border border-border text-text-secondary text-xs font-medium hover:bg-surface-hover transition-colors cursor-pointer"
        >
          주소 복사
        </button>
      </div>

      {/* 장소 정보 */}
      <div className="text-center">
        <p className="venue-name text-base font-semibold text-text-primary">
          {wedding.venueName}
        </p>
        <p className="venue-address text-sm text-text-secondary mt-1">
          {wedding.venueAddress}
        </p>
        {wedding.venueDetail && (
          <p className="venue-detail text-sm text-text-tertiary mt-0.5">
            {wedding.venueDetail}
          </p>
        )}
      </div>
    </motion.section>
  );
};

// ─── Information Section (Dress Code, Parking, Meals, Transport) ───
const InformationSection: FC<InfoTabProps> = ({ data }) => {
  const { wedding, transportations } = data;
  const { dressCode, notice, parkingInfo, mealInfo } = wedding;
  const hasContent =
    dressCode ||
    notice ||
    parkingInfo ||
    mealInfo ||
    transportations.length > 0;

  if (!hasContent) return null;

  const items: { icon: string; title: string; content: string }[] = [];
  if (dressCode)
    items.push({ icon: "👔", title: "드레스 코드", content: dressCode });
  if (notice) items.push({ icon: "📌", title: "유의사항", content: notice });
  if (parkingInfo)
    items.push({ icon: "🅿️", title: "주차 안내", content: parkingInfo });
  if (mealInfo)
    items.push({ icon: "🍽️", title: "식사 안내", content: mealInfo });

  const sorted = [...transportations].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  return (
    <AnimatedSection className="py-10 px-6">
      <SectionLabel text="Information" />
      <div className="space-y-3 max-w-sm mx-auto">
        {items.map((item) => (
          <div
            key={item.title}
            className="info-card flex gap-3 p-4 rounded-xl bg-surface border border-border-light"
          >
            <span className="text-lg mt-0.5">{item.icon}</span>
            <div>
              <p className="info-card-title text-sm font-semibold text-text-primary mb-1">
                {item.title}
              </p>
              <p className="info-card-content text-xs text-text-secondary whitespace-pre-line leading-relaxed">
                {item.content}
              </p>
            </div>
          </div>
        ))}
        {sorted.map((t) => (
          <div
            key={t.id}
            className="transport-card flex gap-3 p-4 rounded-xl bg-surface border border-border-light"
          >
            <span className="text-lg mt-0.5">
              {t.type === "SUBWAY" ? "🚇" : t.type === "BUS" ? "🚌" : "🚐"}
            </span>
            <div>
              <p className="transport-title text-sm font-semibold text-text-primary mb-1">
                {t.title}
              </p>
              {t.description && (
                <p className="transport-desc text-xs text-text-secondary whitespace-pre-line leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </AnimatedSection>
  );
};

// ─── Gift Section (축의금) ───
const giftSideLabels: Record<AccountSide, string> = {
  GROOM: "신랑측",
  GROOM_FAMILY: "신랑측 가족",
  BRIDE: "신부측",
  BRIDE_FAMILY: "신부측 가족",
};

const giftSideOrder: AccountSide[] = [
  "GROOM",
  "GROOM_FAMILY",
  "BRIDE",
  "BRIDE_FAMILY",
];

const GiftAccountCard: FC<{ account: AccountResponse }> = ({ account }) => {
  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label}가 복사되었습니다.`);
  };

  const hasBank = !!(
    account.bankCode &&
    account.bankCode !== "KAKAOPAY" &&
    account.bankCode !== "TOSS" &&
    account.accountNumber
  );

  return (
    <div className="gift-account-card flex items-center justify-between py-3">
      <div className="gift-account-info">
        {hasBank && (
          <>
            <p className="gift-bank-name text-xs text-text-tertiary">
              {account.bankName}
            </p>
            <p className="gift-account-number text-sm text-text-primary mt-0.5">
              {account.accountNumber}
            </p>
          </>
        )}
        {!hasBank && account.kakaoPayUrl && (
          <p className="gift-account-type text-xs text-text-tertiary">
            카카오페이
          </p>
        )}
        {!hasBank && !account.kakaoPayUrl && account.tossNumber && (
          <p className="gift-account-type text-xs text-text-tertiary">토스</p>
        )}
        <p className="gift-account-holder text-xs text-text-secondary mt-0.5">
          {account.accountHolder}
        </p>
      </div>
      <div className="gift-account-actions flex items-center gap-2">
        {account.kakaoPayUrl && (
          <a
            href={account.kakaoPayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kakaopay-btn text-[11px] bg-[#FEE500] text-[#3C1E1E] px-3 py-1.5 rounded-lg font-medium hover:bg-[#FDD835] transition-colors"
          >
            카카오페이
          </a>
        )}
        {account.tossNumber && (
          <button
            onClick={() => handleCopy(account.tossNumber!, "토스 번호")}
            className="toss-btn text-[11px] bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
          >
            토스
          </button>
        )}
        {hasBank && (
          <button
            onClick={() => handleCopy(account.accountNumber!, "계좌번호")}
            className="copy-btn p-2 text-text-tertiary hover:text-primary transition-colors cursor-pointer"
          >
            <IoCopyOutline size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const GiftAccountGroup: FC<{
  side: AccountSide;
  accounts: AccountResponse[];
}> = ({ side, accounts }) => {
  const [open, setOpen] = useState(false);
  const sorted = [...accounts].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="gift-account-group bg-surface rounded-xl border border-border-light overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="gift-group-toggle w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-hover transition-colors"
      >
        <span className="gift-side-label text-sm font-semibold text-text-primary">
          {giftSideLabels[side]}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IoChevronDownOutline className="text-text-tertiary" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="gift-account-list px-5 pb-4 divide-y divide-border-light">
              {sorted.map((account) => (
                <GiftAccountCard key={account.id} account={account} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GiftSection: FC<{ accounts: AccountResponse[] }> = ({ accounts }) => {
  if (accounts.length === 0) return null;

  const grouped = giftSideOrder
    .map((side) => ({
      side,
      accounts: accounts.filter((a) => a.side === side),
    }))
    .filter((g) => g.accounts.length > 0);

  return (
    <AnimatedSection className="py-10 px-6">
      <SectionLabel text="Gift" />
      <div className="text-center mb-6">
        <p className="gift-subtitle text-sm text-text-secondary">
          마음을 전해주세요
        </p>
      </div>
      <div className="space-y-3 max-w-sm mx-auto">
        {grouped.map(({ side, accounts }) => (
          <GiftAccountGroup key={side} side={side} accounts={accounts} />
        ))}
      </div>
    </AnimatedSection>
  );
};

// ─── Main InfoTab ───
export const InfoTab: FC<InfoTabProps> = ({ data }) => {
  return (
    <div className="info-tab -mx-6 -mt-6">
      <LandingSection data={data} />
      <Divider />
      <GreetingSection greeting={data.wedding.greeting} />
      <CoupleSection couples={data.couples} />
      <DateVenueSection wedding={data.wedding} />
      <LocationSection wedding={data.wedding} />
      <InformationSection data={data} />
      <GiftSection accounts={data.accounts} />

      <div className="flex items-center justify-center gap-3 py-4">
        <div className="w-16 h-px bg-primary/10" />
        <div className="w-1 h-1 rounded-full bg-primary/20" />
        <div className="w-16 h-px bg-primary/10" />
      </div>

    </div>
  );
};
