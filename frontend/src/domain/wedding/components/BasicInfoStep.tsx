import { useState, useEffect, useRef, type FC } from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import DaumPostcode from "react-daum-postcode";
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";
import type { WeddingFormData } from "../types.ts";
import { ImageUploader } from "./ImageUploader.tsx";
import { ENV } from "@/global/config/env.ts";

interface BasicInfoStepProps {
  register: UseFormRegister<WeddingFormData>;
  errors: FieldErrors<WeddingFormData>;
  heroImages: File[];
  onHeroImagesChange: (files: File[]) => void;
  setValue: UseFormSetValue<WeddingFormData>;
  venueLat: number | null;
  venueLng: number | null;
  existingHeroUrls?: string[];
  onRemoveExistingHero?: (index: number) => void;
}

const loadKakaoMapSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${ENV.KAKAO_MAP_KEY}&autoload=false&libraries=services`;
    script.onload = () => { window.kakao.maps.load(() => resolve()); };
    script.onerror = () => reject(new Error("카카오맵 로드 실패"));
    document.head.appendChild(script);
  });
};

const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!ENV.KAKAO_MAP_KEY) return null;
  try {
    await loadKakaoMapSdk();
    return new Promise((resolve) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
        } else {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
};

const MapPreview: FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !ENV.KAKAO_MAP_KEY) return;
    let isMounted = true;
    loadKakaoMapSdk()
      .then(() => {
        if (!isMounted || !mapRef.current) return;
        const { kakao } = window;
        const position = new kakao.maps.LatLng(lat, lng);
        const map = new kakao.maps.Map(mapRef.current, { center: position, level: 3 });
        new kakao.maps.Marker({ map, position });
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [lat, lng]);

  if (!ENV.KAKAO_MAP_KEY) return null;
  return <div ref={mapRef} className="w-full h-48" />;
}

export const BasicInfoStep: FC<BasicInfoStepProps> = ({ register, errors, heroImages, onHeroImagesChange, setValue, venueLat, venueLng, existingHeroUrls, onRemoveExistingHero }) => {
  const [showPostcode, setShowPostcode] = useState(false);

  const handleAddressComplete = async (data: { roadAddress: string; address: string }) => {
    const address = data.roadAddress || data.address;
    setValue("wedding.venueAddress", address);
    setShowPostcode(false);

    const coords = await geocodeAddress(address);
    if (coords) {
      setValue("wedding.venueLat", coords.lat);
      setValue("wedding.venueLng", coords.lng);
    } else {
      setValue("wedding.venueLat", null);
      setValue("wedding.venueLng", null);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-text-primary">기본 정보</h2>

      {/* 제목 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1.5">
          초대장 제목 <span className="text-error">*</span>
        </label>
        <input
          id="title"
          {...register("wedding.title")}
          placeholder="우리의 결혼식에 초대합니다"
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {errors.wedding?.title && (
          <p className="mt-1 text-sm text-error">{errors.wedding.title.message}</p>
        )}
      </div>

      {/* 예식 일시 */}
      <div>
        <label htmlFor="weddingDate" className="block text-sm font-medium text-text-primary mb-1.5">
          예식 일시 <span className="text-error">*</span>
        </label>
        <input
          id="weddingDate"
          type="datetime-local"
          {...register("wedding.weddingDate")}
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {errors.wedding?.weddingDate && (
          <p className="mt-1 text-sm text-error">{errors.wedding.weddingDate.message}</p>
        )}
      </div>

      {/* 예식장 이름 */}
      <div>
        <label htmlFor="venueName" className="block text-sm font-medium text-text-primary mb-1.5">
          예식장 이름 <span className="text-error">*</span>
        </label>
        <input
          id="venueName"
          {...register("wedding.venueName")}
          placeholder="○○웨딩홀"
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {errors.wedding?.venueName && (
          <p className="mt-1 text-sm text-error">{errors.wedding.venueName.message}</p>
        )}
      </div>

      {/* 주소 검색 */}
      <div>
        <label htmlFor="venueAddress" className="block text-sm font-medium text-text-primary mb-1.5">
          예식장 주소 <span className="text-error">*</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="venueAddress"
            {...register("wedding.venueAddress")}
            readOnly
            placeholder="주소를 검색해주세요"
            className="flex-1 px-4 py-3 border border-border rounded-xl bg-bg-secondary text-text-primary cursor-pointer"
            onClick={() => setShowPostcode(true)}
          />
          <button
            type="button"
            onClick={() => setShowPostcode(true)}
            className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors cursor-pointer flex items-center gap-1"
          >
            <IoSearchOutline size={16} />
            검색
          </button>
        </div>
        {errors.wedding?.venueAddress && (
          <p className="mt-1 text-sm text-error">{errors.wedding.venueAddress.message}</p>
        )}
      </div>

      {/* DaumPostcode 모달 */}
      {showPostcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
          <div className="bg-bg-primary rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-medium text-text-primary">주소 검색</span>
              <button
                type="button"
                onClick={() => setShowPostcode(false)}
                className="p-1 hover:bg-bg-secondary rounded-full transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} className="text-text-secondary" />
              </button>
            </div>
            <DaumPostcode onComplete={handleAddressComplete} style={{ height: 400 }} />
          </div>
        </div>
      )}

      {/* 상세 주소 */}
      <div>
        <label htmlFor="venueDetail" className="block text-sm font-medium text-text-primary mb-1.5">
          상세 주소
        </label>
        <input
          id="venueDetail"
          {...register("wedding.venueDetail")}
          placeholder="층, 홀 이름 등"
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
      </div>

      {/* 지도 미리보기 */}
      {venueLat != null && venueLng != null && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">위치 미리보기</label>
          <div className="rounded-xl overflow-hidden border border-border">
            <MapPreview lat={venueLat} lng={venueLng} />
          </div>
        </div>
      )}

      {/* 인사말 */}
      <div className="greeting-field">
        <label htmlFor="greeting" className="block text-sm font-medium text-text-primary mb-1.5">
          인사말
        </label>
        <textarea
          id="greeting"
          {...register("wedding.greeting")}
          rows={6}
          placeholder={"인연이 되어 서로의 삶에 스며든 두 사람이\n이제는 부부로서의 인연을 시작하고자 합니다.\n소중한 분들 앞에서\n서로에게 평생의 약속을 전하려 하오니\n\n뜻깊은 자리에 함께하시어\n따뜻한 마음으로 축복해 주신다면\n더없이 감사한 기억으로 간직하겠습니다."}
          className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
        />
        {errors.wedding?.greeting && (
          <p className="mt-1 text-sm text-error">{errors.wedding.greeting.message}</p>
        )}
      </div>

      {/* Hero Images */}
      <ImageUploader
        images={heroImages}
        onChange={onHeroImagesChange}
        maxCount={4}
        label="대표 이미지"
        existingUrls={existingHeroUrls}
        onRemoveExisting={onRemoveExistingHero}
      />
    </div>
  );
}
