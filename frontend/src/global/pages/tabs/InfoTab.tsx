import { useState, useEffect, useCallback, useRef, type FC } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { IoCallOutline, IoNavigateOutline, IoCopyOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import type { WeddingDetailResponse } from "@/domain/wedding/types.ts";
import { ENV } from "@/global/config/env.ts";

interface InfoTabProps {
  data: WeddingDetailResponse;
}

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const kenBurns = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.5 } },
};

const AnimatedSection: FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.section ref={ref} variants={slideUp} initial="hidden" animate={isInView ? "visible" : "hidden"} className={className}>
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
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${DAYS[d.getDay()]}요일`;
  };

  return (
    <section className="relative w-full overflow-hidden bg-black" style={{ minHeight: "85vh" }}>
      {images.length > 0 ? (
        <div className="relative w-full h-full" style={{ minHeight: "85vh" }}>
          <AnimatePresence mode="wait">
            <motion.div key={current} variants={kenBurns} initial="hidden" animate="visible" exit="exit" className="absolute inset-0">
              <img src={images[current].imageUrl} alt={`슬라이드 ${current + 1}`} className="w-full h-full object-cover" style={{ minHeight: "85vh" }} />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
        </div>
      ) : (
        <div className="w-full bg-gradient-to-b from-[#f5ede4] to-[#e8ddd0]" style={{ minHeight: "85vh" }} />
      )}

      <div className="absolute bottom-0 left-0 right-0 pb-12 px-6 text-center text-white">
        {groom && bride && (
          <p className="text-lg tracking-[0.3em] font-light mb-3 drop-shadow-lg">
            {groom.name} <span className="text-white/60 mx-2">&</span> {bride.name}
          </p>
        )}
        <h1 className="text-2xl font-semibold mb-4 drop-shadow-lg leading-relaxed">{wedding.title}</h1>
        <p className="text-sm tracking-[0.15em] text-white/80 drop-shadow">{formatDate(wedding.weddingDate)}</p>

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
const CoupleSection: FC<{ couples: WeddingDetailResponse["couples"] }> = ({ couples }) => {
  const groom = couples.find((c) => c.role === "GROOM");
  const bride = couples.find((c) => c.role === "BRIDE");

  if (!groom && !bride) return null;

  const renderParents = (couple: typeof groom) => {
    if (!couple) return null;
    const parts: string[] = [];
    if (couple.fatherName) parts.push(`${couple.isFatherAlive ? "" : "故 "}${couple.fatherName}`);
    if (couple.motherName) parts.push(`${couple.isMotherAlive ? "" : "故 "}${couple.motherName}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  const renderPerson = (couple: typeof groom, label: string) => {
    if (!couple) return null;
    return (
      <div className="flex flex-col items-center text-center">
        {couple.profileImageUrl ? (
          <img src={couple.profileImageUrl} alt={couple.name} className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-sm mb-3" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-white shadow-sm mb-3 flex items-center justify-center text-gray-400 text-2xl">
            {couple.name.charAt(0)}
          </div>
        )}
        <p className="text-xs text-primary/60 mb-1">{label}</p>
        <p className="text-base font-semibold text-gray-800">{couple.name}</p>
        {renderParents(couple) && (
          <p className="text-xs text-gray-400 mt-1">{renderParents(couple)}</p>
        )}
        {couple.contact && (
          <a href={`tel:${couple.contact}`} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors">
            <IoCallOutline size={14} />
            연락하기
          </a>
        )}
      </div>
    );
  };

  return (
    <AnimatedSection className="py-10 px-6">
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
const DateVenueSection: FC<{ wedding: WeddingDetailResponse["wedding"] }> = ({ wedding }) => {
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
    <AnimatedSection className="py-10 px-6">
      <SectionLabel text="Wedding Day" />
      <div className="text-center mb-8">
        <p className="text-2xl font-semibold text-gray-800">{year}년 {month}월 {day}일 {dow}요일</p>
        <p className="text-sm text-gray-500 mt-1">{ampm} {displayHour}시{minute > 0 ? ` ${minute}분` : ""}</p>
      </div>

      {/* 미니 캘린더 */}
      <div className="max-w-xs mx-auto mb-8">
        <div className="grid grid-cols-7 text-center text-[11px] mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <span key={d} className={i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center text-xs gap-y-1">
          {calendarDays.map((cd, i) => {
            const isWeddingDay = cd === day;
            const dayOfWeek = i % 7;
            return (
              <div key={i} className={`py-1 ${isWeddingDay ? "relative" : ""}`}>
                {cd && (
                  <span className={`
                    ${isWeddingDay ? "bg-primary text-white w-7 h-7 rounded-full inline-flex items-center justify-center font-semibold" : ""}
                    ${!isWeddingDay && dayOfWeek === 0 ? "text-red-400" : ""}
                    ${!isWeddingDay && dayOfWeek === 6 ? "text-blue-400" : ""}
                    ${!isWeddingDay ? "text-gray-600" : ""}
                  `}>
                    {cd}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* 장소 정보 */}
      <div className="text-center">
        <p className="text-base font-semibold text-gray-800">{wedding.venueName}</p>
        <p className="text-sm text-gray-500 mt-1">{wedding.venueAddress}</p>
        {wedding.venueDetail && <p className="text-sm text-gray-400 mt-0.5">{wedding.venueDetail}</p>}
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
    script.onload = () => { window.kakao.maps.load(() => resolve()); };
    script.onerror = () => reject(new Error("카카오맵 로드 실패"));
    document.head.appendChild(script);
  });
};

const LocationSection: FC<{ wedding: WeddingDetailResponse["wedding"] }> = ({ wedding }) => {
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
        const position = new kakao.maps.LatLng(wedding.venueLat!, wedding.venueLng!);
        const map = new kakao.maps.Map(mapRef.current, { center: position, level: 3 });
        new kakao.maps.Marker({ map, position });
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [hasMap, wedding.venueLat, wedding.venueLng]);

  if (!hasMap) return null;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wedding.venueAddress);
      toast.success("주소가 복사되었습니다");
    } catch { toast.error("주소 복사에 실패했습니다"); }
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
      className="py-10 px-6"
    >
      <SectionLabel text="Location" />

      {ENV.KAKAO_MAP_KEY && (
        <div ref={mapRef} className="w-full h-60 rounded-2xl mb-4 bg-gray-100 shadow-inner" />
      )}

      <div className="flex gap-2 justify-center">
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
          className="flex-1 max-w-[120px] py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
        >
          주소 복사
        </button>
      </div>
    </motion.section>
  );
};

// ─── Schedule Section ───
const ScheduleSection: FC<{ schedules: WeddingDetailResponse["schedules"] }> = ({ schedules }) => {
  if (schedules.length === 0) return null;
  const sorted = [...schedules].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <AnimatedSection className="py-10 px-6">
      <SectionLabel text="Ceremony" />
      <div className="relative max-w-sm mx-auto">
        <div className="absolute left-[6px] top-3 bottom-3 w-px bg-primary/15" />
        <div className="space-y-6">
          {sorted.map((schedule, i) => (
            <div key={schedule.id} className="relative pl-8">
              <div className={`absolute left-0 top-1 w-[13px] h-[13px] rounded-full border-2 ${
                i === 0 ? "border-primary bg-primary" : "border-primary/40 bg-white"
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-700">{schedule.title}</p>
                {schedule.description && <p className="text-xs text-gray-400 mt-0.5">{schedule.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

// ─── Information Section (Dress Code, Parking, Meals, Transport) ───
const InformationSection: FC<InfoTabProps> = ({ data }) => {
  const { wedding, transportations } = data;
  const { dressCode, notice, parkingInfo, mealInfo } = wedding;
  const hasContent = dressCode || notice || parkingInfo || mealInfo || transportations.length > 0;

  if (!hasContent) return null;

  const items: { icon: string; title: string; content: string }[] = [];
  if (dressCode) items.push({ icon: "👔", title: "드레스 코드", content: dressCode });
  if (notice) items.push({ icon: "📌", title: "유의사항", content: notice });
  if (parkingInfo) items.push({ icon: "🅿️", title: "주차 안내", content: parkingInfo });
  if (mealInfo) items.push({ icon: "🍽️", title: "식사 안내", content: mealInfo });

  const sorted = [...transportations].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <AnimatedSection className="py-10 px-6">
      <SectionLabel text="Information" />
      <div className="space-y-3 max-w-sm mx-auto">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3 p-4 rounded-xl bg-white border border-gray-100">
            <span className="text-lg mt-0.5">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{item.title}</p>
              <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{item.content}</p>
            </div>
          </div>
        ))}
        {sorted.map((t) => (
          <div key={t.id} className="flex gap-3 p-4 rounded-xl bg-white border border-gray-100">
            <span className="text-lg mt-0.5">
              {t.type === "SUBWAY" ? "🚇" : t.type === "BUS" ? "🚌" : "🚐"}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{t.title}</p>
              {t.description && <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{t.description}</p>}
            </div>
          </div>
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
      <CoupleSection couples={data.couples} />
      <DateVenueSection wedding={data.wedding} />
      <LocationSection wedding={data.wedding} />
      <ScheduleSection schedules={data.schedules} />
      <InformationSection data={data} />

      <div className="flex items-center justify-center gap-3 py-4">
        <div className="w-16 h-px bg-primary/10" />
        <div className="w-1 h-1 rounded-full bg-primary/20" />
        <div className="w-16 h-px bg-primary/10" />
      </div>

      <footer className="py-10 text-center">
        <p className="text-[10px] tracking-[0.3em] text-gray-300 uppercase">
          Powered by Love 6202
        </p>
      </footer>
    </div>
  );
};
