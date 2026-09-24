export const HOMESTAY_BANK_INFO = {
  bankName: 'MB Bank (Ngân hàng TMCP Quân Đội)',
  bankShortName: 'MB',
  bin: '970422',
  accountNumber: '0909123456',
  accountHolder: 'CHICSTAY DA LAT',
  branch: 'Chi nhánh Đà Lạt - Lâm Đồng',
};

/**
 * Generate official VietQR Quick Link
 */
export function getVietQRImageUrl(amount: number, memo: string): string {
  const cleanMemo = memo.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return `https://img.vietqr.io/image/${HOMESTAY_BANK_INFO.bankShortName}-${HOMESTAY_BANK_INFO.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(cleanMemo)}&accountName=${encodeURIComponent(HOMESTAY_BANK_INFO.accountHolder)}`;
}
