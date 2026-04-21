import { useState, useRef, type FC } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { IoCopyOutline, IoChevronDownOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import type { AccountResponse, AccountSide } from "@/domain/wedding/types.ts";

interface AccountTabProps {
  accounts: AccountResponse[];
}

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const sideLabels: Record<AccountSide, string> = {
  GROOM: "신랑측",
  GROOM_FAMILY: "신랑측 가족",
  BRIDE: "신부측",
  BRIDE_FAMILY: "신부측 가족",
};

const sideOrder: AccountSide[] = ["GROOM", "GROOM_FAMILY", "BRIDE", "BRIDE_FAMILY"];

const AccountCard: FC<{ account: AccountResponse }> = ({ account }) => {
  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label}가 복사되었습니다.`);
  };

  const hasBank = !!(account.bankCode && account.bankCode !== "KAKAOPAY" && account.bankCode !== "TOSS" && account.accountNumber);

  return (
    <div className="account-card flex items-center justify-between py-3">
      <div className="account-info">
        {hasBank && (
          <>
            <p className="account-bank-name text-xs text-text-tertiary">{account.bankName}</p>
            <p className="account-number text-sm text-text-primary mt-0.5">{account.accountNumber}</p>
          </>
        )}
        {!hasBank && account.kakaoPayUrl && (
          <p className="account-type text-xs text-text-tertiary">카카오페이</p>
        )}
        {!hasBank && !account.kakaoPayUrl && account.tossNumber && (
          <p className="account-type text-xs text-text-tertiary">토스</p>
        )}
        <p className="account-holder text-xs text-text-secondary mt-0.5">{account.accountHolder}</p>
      </div>
      <div className="account-actions flex items-center gap-2">
        {account.kakaoPayUrl && (
          <a
            href={account.kakaoPayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kakaopay-button text-[11px] bg-[#FEE500] text-[#3C1E1E] px-3 py-1.5 rounded-lg font-medium hover:bg-[#FDD835] transition-colors"
          >
            카카오페이
          </a>
        )}
        {account.tossNumber && (
          <button
            onClick={() => handleCopy(account.tossNumber!, "토스 번호")}
            className="toss-button text-[11px] bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors cursor-pointer"
          >
            토스
          </button>
        )}
        {hasBank && (
          <button
            onClick={() => handleCopy(account.accountNumber!, "계좌번호")}
            className="copy-button p-2 text-text-tertiary hover:text-primary transition-colors cursor-pointer"
          >
            <IoCopyOutline size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const AccountGroup: FC<{ side: AccountSide; accounts: AccountResponse[] }> = ({ side, accounts }) => {
  const [open, setOpen] = useState(false);
  const sorted = [...accounts].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="account-group bg-surface rounded-xl border border-border-light overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="account-group-toggle w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-hover transition-colors"
      >
        <span className="account-side-label text-sm font-semibold text-text-primary">{sideLabels[side]}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
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
            <div className="account-list px-5 pb-4 divide-y divide-border-light">
              {sorted.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AccountTab: FC<AccountTabProps> = ({ accounts }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  if (accounts.length === 0) {
    return (
      <div className="account-empty text-center py-16 text-text-tertiary">
        등록된 축의금 계좌가 없습니다.
      </div>
    );
  }

  // 사이드별 그룹핑
  const grouped = sideOrder
    .map((side) => ({ side, accounts: accounts.filter((a) => a.side === side) }))
    .filter((g) => g.accounts.length > 0);

  return (
    <motion.div ref={ref} variants={slideUp} initial="hidden" animate={isInView ? "visible" : "hidden"} className="account-tab py-4">
      <p className="text-[10px] tracking-[0.4em] text-primary/40 mb-8 uppercase font-medium text-center">
        Gift
      </p>
      <div className="text-center mb-6">
        <p className="account-subtitle text-sm text-text-secondary">마음을 전해주세요</p>
      </div>
      <div className="space-y-3 max-w-sm mx-auto">
        {grouped.map(({ side, accounts }) => (
          <AccountGroup key={side} side={side} accounts={accounts} />
        ))}
      </div>
    </motion.div>
  );
};
