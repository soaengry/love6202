import { useState, useRef, useEffect, type FC } from "react";
import {
  useFieldArray,
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import {
  IoAddCircleOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import type { WeddingFormData, PaymentMethod } from "../types.ts";
import { weddingApi } from "../api/weddingApi.ts";
import { SIDE_OPTIONS, PAYMENT_METHODS } from "../wedding.constants.ts";
import { formatPhoneDisplay } from "../wedding.utils.ts";

interface AccountStepProps {
  control: Control<WeddingFormData>;
  errors: FieldErrors<WeddingFormData>;
  register: UseFormRegister<WeddingFormData>;
  setValue: UseFormSetValue<WeddingFormData>;
}

const inputClass =
  "w-full px-4 py-2.5 border border-border rounded-xl bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";
const inputErrorClass =
  "w-full px-4 py-2.5 border border-error rounded-xl bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-error/50 focus:border-error transition-colors";
const labelClass = "block text-sm font-medium text-text-primary mb-1";
const errorMsgClass = "text-xs text-error mt-1";

export const AccountStep: FC<AccountStepProps> = ({
  control,
  errors,
  register,
  setValue,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "accounts",
  });
  const accounts = useWatch({ control, name: "accounts" });
  const [detectingMap, setDetectingMap] = useState<Record<number, boolean>>({});
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // 언마운트 시 미실행 타이머 정리
  useEffect(() => {
    return () => { Object.values(debounceTimers.current).forEach(clearTimeout); };
  }, []);

  const handleAdd = (type: PaymentMethod) => {
    append({
      side: "GROOM",
      bankName:
        type === "KAKAOPAY" ? "카카오페이" : type === "TOSS" ? "토스" : "",
      bankCode:
        type === "KAKAOPAY" ? "KAKAOPAY" : type === "TOSS" ? "TOSS" : "",
      accountNumber: "",
      accountHolder: "",
      kakaoPayUrl: "",
      tossNumber: "",
      orderIndex: fields.length,
      paymentType: type,
    });
  };

  const detectBank = (index: number, accountNumber: string) => {
    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index]);
    }

    const cleaned = accountNumber.replace(/[^0-9]/g, "");
    if (cleaned.length < 3) {
      setValue(`accounts.${index}.bankName`, "");
      setValue(`accounts.${index}.bankCode`, "");
      return;
    }

    setDetectingMap((prev) => ({ ...prev, [index]: true }));

    debounceTimers.current[index] = setTimeout(async () => {
      try {
        const { data } = await weddingApi.detectBank(accountNumber);
        setValue(`accounts.${index}.bankName`, data.bankName);
        setValue(`accounts.${index}.bankCode`, data.bankCode);
      } catch {
        // 감지 실패 시 무시
      } finally {
        setDetectingMap((prev) => ({ ...prev, [index]: false }));
      }
    }, 400);
  };

  const handleAccountNumberChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    setValue(`accounts.${index}.accountNumber`, digits);
    detectBank(index, digits);
  };

  const getPaymentType = (index: number): PaymentMethod => {
    return accounts?.[index]?.paymentType ?? "BANK";
  };

  const getError = (index: number, field: string): string | undefined => {
    const accountErrors = errors.accounts as Record<number, Record<string, { message?: string }>> | undefined;
    return accountErrors?.[index]?.[field]?.message;
  };

  const renderBankForm = (index: number) => {
    const account = accounts?.[index];
    const isDetecting = detectingMap[index] ?? false;
    const cleaned = (account?.accountNumber ?? "").replace(/[^0-9]/g, "");
    const accountNumberError = getError(index, "accountNumber");
    const bankNameError = getError(index, "bankName");
    const holderError = getError(index, "accountHolder");

    return (
      <div className="space-y-3">
        <div>
          <label className={labelClass}>계좌번호</label>
          <input
            value={account?.accountNumber ?? ""}
            onChange={(e) => handleAccountNumberChange(index, e.target.value)}
            inputMode="numeric"
            placeholder="계좌번호를 입력하면 은행이 자동 감지됩니다"
            className={accountNumberError ? inputErrorClass : inputClass}
          />
          {accountNumberError && (
            <p className={errorMsgClass}>{accountNumberError}</p>
          )}
        </div>

        <div className="flex items-center gap-2 min-h-[28px]">
          {isDetecting ? (
            <span className="text-xs text-text-secondary">은행 감지 중...</span>
          ) : account?.bankName ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {account.bankName}
            </span>
          ) : cleaned.length >= 3 ? (
            <span className="text-xs text-error">
              은행을 감지할 수 없습니다. 직접 입력해주세요.
            </span>
          ) : null}
        </div>

        {!account?.bankName && cleaned.length >= 3 && !isDetecting && (
          <div>
            <label className={labelClass}>은행명</label>
            <input
              {...register(`accounts.${index}.bankName`)}
              placeholder="○○은행"
              className={bankNameError ? inputErrorClass : inputClass}
            />
            {bankNameError && <p className={errorMsgClass}>{bankNameError}</p>}
          </div>
        )}

        <div>
          <label className={labelClass}>예금주</label>
          <input
            {...register(`accounts.${index}.accountHolder`)}
            placeholder="홍길동"
            className={holderError ? inputErrorClass : inputClass}
          />
          {holderError && <p className={errorMsgClass}>{holderError}</p>}
        </div>
      </div>
    );
  };

  const renderKakaoPayForm = (index: number) => {
    const kakaoError = getError(index, "kakaoPayUrl");
    const holderError = getError(index, "accountHolder");

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-warning-light rounded-lg">
          <span className="text-lg">💛</span>
          <span className="text-xs text-warning-text font-medium">
            카카오페이 송금 링크를 입력해주세요
          </span>
        </div>
        <div>
          <label className={labelClass}>카카오페이 송금 URL</label>
          <input
            {...register(`accounts.${index}.kakaoPayUrl`)}
            placeholder="https://qr.kakaopay.com/..."
            className={kakaoError ? inputErrorClass : inputClass}
          />
          {kakaoError && <p className={errorMsgClass}>{kakaoError}</p>}
        </div>
        <div>
          <label className={labelClass}>받는 분</label>
          <input
            {...register(`accounts.${index}.accountHolder`)}
            placeholder="홍길동"
            className={holderError ? inputErrorClass : inputClass}
          />
          {holderError && <p className={errorMsgClass}>{holderError}</p>}
        </div>
      </div>
    );
  };

  const renderTossForm = (index: number) => {
    const tossError = getError(index, "tossNumber");
    const holderError = getError(index, "accountHolder");

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-info-light rounded-lg">
          <span className="text-lg">💙</span>
          <span className="text-xs text-info-text font-medium">
            토스 송금 정보를 입력해주세요
          </span>
        </div>
        <div>
          <label className={labelClass}>토스 ID (전화번호)</label>
          <Controller
            name={`accounts.${index}.tossNumber`}
            control={control}
            render={({ field }) => (
              <input
                value={formatPhoneDisplay(field.value ?? "")}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  field.onChange(digits);
                }}
                inputMode="numeric"
                placeholder="010-1234-5678"
                className={tossError ? inputErrorClass : inputClass}
              />
            )}
          />
          {tossError && <p className={errorMsgClass}>{tossError}</p>}
        </div>
        <div>
          <label className={labelClass}>받는 분</label>
          <input
            {...register(`accounts.${index}.accountHolder`)}
            placeholder="홍길동"
            className={holderError ? inputErrorClass : inputClass}
          />
          {holderError && <p className={errorMsgClass}>{holderError}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">축의금 계좌</h2>
        <span className="text-xs text-text-secondary">선택사항</span>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-6">
          아래 버튼으로 송금 방법을 추가해주세요.
        </p>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const type = getPaymentType(index);
          const method = PAYMENT_METHODS.find((m) => m.value === type);

          return (
            <div
              key={field.id}
              className="bg-bg-secondary rounded-xl p-4 space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{method?.icon}</span>
                  <span className="text-xs font-medium text-text-secondary">
                    {method?.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1 text-text-secondary hover:text-error transition-colors cursor-pointer"
                >
                  <IoCloseCircleOutline size={18} />
                </button>
              </div>

              <input
                type="hidden"
                {...register(`accounts.${index}.orderIndex`)}
                value={index}
              />
              <input
                type="hidden"
                {...register(`accounts.${index}.paymentType`)}
              />
              <input
                type="hidden"
                {...register(`accounts.${index}.bankName`)}
              />
              <input
                type="hidden"
                {...register(`accounts.${index}.bankCode`)}
              />

              {/* 구분 */}
              <div>
                <label className={labelClass}>구분</label>
                <select
                  {...register(`accounts.${index}.side`)}
                  className={inputClass}
                >
                  {SIDE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 결제 타입별 폼 */}
              {type === "BANK" && renderBankForm(index)}
              {type === "KAKAOPAY" && renderKakaoPayForm(index)}
              {type === "TOSS" && renderTossForm(index)}
            </div>
          );
        })}
      </div>

      {/* 송금 방법 추가 버튼들 */}
      <div className="space-y-2">
        <p className="text-xs text-text-secondary font-medium">
          송금 방법 추가
        </p>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => handleAdd(method.value)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-border text-text-secondary text-xs font-medium hover:bg-bg-secondary hover:border-primary/30 transition-colors cursor-pointer"
            >
              <span>{method.icon}</span>
              <IoAddCircleOutline size={14} />
              <span>{method.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
