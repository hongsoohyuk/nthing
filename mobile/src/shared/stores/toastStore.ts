import { create } from 'zustand';

type ToastState = {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
};

// 가벼운 단일 토스트. 컴포넌트(Toaster)가 표시 + 자동 dismiss 를 담당한다.
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}));

// 컴포넌트 밖(이벤트 핸들러 등)에서도 호출하기 위한 헬퍼.
export function toast(message: string): void {
  useToastStore.getState().show(message);
}
